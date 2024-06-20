mod helper;
mod external_promise;

use helper::*;
use near_sdk::{env, log, near, serde::{Deserialize, Serialize}, serde_json, AccountId, Gas, NearToken, Promise, PromiseResult};

// Define the contract structure
#[near(contract_state)]
pub struct Contract {
    registered_tokens: Vec<AccountId>,
    owner_id: AccountId,
    ref_finance_id: AccountId,
    fee: u128,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
struct TokenExchange {
    token_in: String,
    token_out: String,
    amount_in: String,
    pool_id: u32,
    min_amount_out: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct Message {
    actions: Vec<TokenExchange>
}

// Define the default, which automatically initializes the contract
impl Default for Contract {
    fn default() -> Self {
        env::panic_str("The contract is not initialized.");
    }
}

// Implement the contract structure
#[near]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId, fee: u128, ref_finance_id: AccountId) -> Self {
        assert!(!env::state_exists(), "The contract is already initialized.");
        assert_eq!(env::current_account_id(), env::predecessor_account_id(), "Predecessor account must be the same as the current account.");
        assert!(fee <= 10000, "Fee must be less than or equal to 100%.");

        Self {
            owner_id: owner_id,
            registered_tokens: Vec::new(),
            fee: fee,
            ref_finance_id: ref_finance_id,
        }
    }

    #[payable]
    pub fn change_owner_id(&mut self, owner_id: AccountId) {
        assert_owner_and_full_access(&self.owner_id);

        self.owner_id = owner_id;
    }

    #[payable]
    pub fn register_tokens(&mut self, token_ids: Vec<AccountId>) -> Promise {
        assert_owner_and_full_access(&self.owner_id);

        for token_id in token_ids.clone().iter() {
            if !self.registered_tokens.contains(token_id) {
                self.registered_tokens.push(token_id.clone());
            }
        }

        external_promise::register_tokens(token_ids, self.ref_finance_id.clone())
    }

    #[payable]
    pub fn withdraw_from_ref(&mut self, amount: String, token_id: AccountId) -> Promise {
        assert_owner_and_full_access(&self.owner_id);

        external_promise::withdraw_from_ref(amount, token_id, self.ref_finance_id.clone())
    }

    #[payable]
    pub fn withdraw(&mut self, amount: String, token_id: AccountId, receiver_id: AccountId) -> Promise {
        assert_owner_and_full_access(&self.owner_id);

        match token_id.to_string().as_str() {
            "near" => {
                Promise::new(receiver_id).transfer(NearToken::from_yoctonear(amount.parse().unwrap()))
            }
            _ => {
                external_promise::transfer_ft(token_id, receiver_id, amount)
            }
        }
    }

    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: String, msg: String) -> String {
        let token_id = env::predecessor_account_id();
        let amount = amount.parse::<u128>().expect("Failed to parse amount.");

        // Preventing the contract halting half way through the transaction
        assert!(env::prepaid_gas() > Gas::from_tgas(250), "Not enough gas to process the transaction.");

        // Refund all the tokens if the token is not registered
        if !self.registered_tokens.contains(&token_id) {
            log!("Token {} is not registered.", token_id);
            return amount.to_string();
        };

        // Parsing message
        let swap_routes = serde_json::from_str::<Message>(&msg).unwrap().actions;

        // We can only support one swap route
        // Otherwise if any of the swap failed in between the routes due to slippage, we hard
        // to refund the tokens back to the user
        assert_eq!(swap_routes.len(), 1);

        let exchange = swap_routes.get(0).unwrap().clone();

        let token_in: AccountId = exchange.token_in.as_str().parse().unwrap();

        // Refund all the tokens if the token is not the first token in the exchange
        if token_in != token_id {
            log!("Token {} is not the input token in the swap.", token_id);
            return amount.to_string();
        }

        let token_out = exchange.token_out.as_str().parse().unwrap();

        // Refund all the tokens if the token out is not registered
        if !self.registered_tokens.contains(&token_out) {
            log!("Token {} is not registered.", token_out);
            return amount.to_string();
        }

        let amount_in = exchange.amount_in.clone().parse::<u128>().unwrap();
        let balance = amount - amount_in;

        let fee = amount_in * self.fee / 10000;
        
        let new_amount_in = amount_in - fee;
        
        let new_swap_routes = vec![TokenExchange {
            amount_in: new_amount_in.to_string(),
            ..exchange
        }];

        external_promise::ft_transfer_call(token_in.clone(), self.ref_finance_id.clone(), new_amount_in.to_string(), "".to_string()).then(
            external_promise::swap(new_swap_routes, self.owner_id.clone(), self.ref_finance_id.clone())
        ).then(
            Promise::new(env::current_account_id()).function_call(
                "on_ft_transfer_complete".to_string(),
                serde_json::json!({
                    "amount_in": amount.to_string(),
                    "sender": sender_id.to_string(),
                    "token_in": token_in.to_string(),
                    "token_out": token_out.to_string()
                }).to_string().as_bytes().to_vec(),
                NearToken::from_yoctonear(0),
                Gas::from_tgas(80)
            )
        );

        return balance.to_string();
    }

    #[private]
    pub fn on_ft_transfer_complete(&mut self, amount_in: String, sender: AccountId, token_in: AccountId, token_out: AccountId) -> Promise {
        assert!(env::promise_results_count() > 0, "No promise results found.");

        let promise_result = env::promise_result(0);

        match promise_result {
            PromiseResult::Failed => {
                log!("Promise failed.");
                external_promise::withdraw_from_ref(amount_in.clone(), token_in.clone(), self.ref_finance_id.clone())
                .then(
                    external_promise::transfer_ft(token_in, sender, amount_in)
                )
            }
            PromiseResult::Successful(result) => {
                let amount_out = String::from_utf8(result).unwrap().trim_matches('"').to_string();
                log!("Promise succeed with result {}", amount_out);

                external_promise::withdraw_from_ref(amount_out.clone(), token_out.clone(), self.ref_finance_id.clone())
                .then(
                    external_promise::transfer_ft(token_out, sender, amount_out)
                )
            }
        }
    }

    pub fn get_registered_tokens(&self) -> Vec<AccountId> {
        self.registered_tokens.clone()
    }

    pub fn get_fees(&self) -> String {
        let percentage = self.fee as f64 / 100.0;

        format!("{:02}%", percentage)
    }

    pub fn get_owner_id(&self) -> AccountId {
        self.owner_id.clone()
    }
}
