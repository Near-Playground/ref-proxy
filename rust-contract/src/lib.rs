mod config;
mod helper;
mod external_promise;

use config::*;
use helper::*;
use near_sdk::{env, log, near, serde::{Deserialize, Serialize}, serde_json, AccountId, Gas, NearToken, Promise, PromiseResult};

// Define the contract structure
#[near(contract_state)]
pub struct Contract {
    registered_tokens: Vec<AccountId>,
    owner_id: AccountId
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct TokenExchange {
    token_in: String,
    token_out: String,
    amount_in: String,
    pool_id: u32,
    min_amount_out: String,
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
    pub fn new(owner_id: AccountId) -> Self {
        assert!(!env::state_exists(), "The contract is already initialized.");
        assert_eq!(env::current_account_id(), env::predecessor_account_id(), "Predecessor account must be the same as the current account.");

        Self {
            owner_id: owner_id,
            registered_tokens: Vec::new()
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

        external_promise::register_tokens(token_ids)
    }

    #[payable]
    pub fn withdraw_from_ref(&mut self, amount: u128, token_id: AccountId) -> Promise {
        assert_owner_and_full_access(&self.owner_id);

        external_promise::withdraw_from_ref(amount, token_id)
    }

    #[payable]
    pub fn withdraw(&mut self, amount: u128, token_id: AccountId, receiver_id: AccountId) -> Promise {
        assert_owner_and_full_access(&self.owner_id);

        match token_id.to_string().as_str() {
            "near" => {
                Promise::new(receiver_id).transfer(NearToken::from_yoctonear(amount))
            }
            _ => {
                external_promise::transfer_ft(token_id, receiver_id, amount)
            }
        }
    }

    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: u128, msg: String) -> u128 {
        let token_id = env::predecessor_account_id();

        // Preventing the contract halting half way through the transaction
        assert!(env::prepaid_gas() > Gas::from_tgas(250), "Not enough gas to process the transaction.");

        // Refund all the tokens if the token is not registered
        if !self.registered_tokens.contains(&token_id) {
            log!("Token {} is not registered.", token_id);
            return amount;
        };

        // Parsing message
        let swap_routes = serde_json::from_str::<Vec<TokenExchange>>(&msg).expect("Failed to parse the msg.");

        let first_exchange = swap_routes.get(0).expect("Must have at least one token exchange.");
        let last_exchange = swap_routes.get(swap_routes.len() - 1).expect("Must have at least one token exchange.");

        let token_in: AccountId = first_exchange.token_in.as_str().parse().unwrap();

        // Refund all the tokens if the token is not the first token in the exchange
        if token_in != token_id {
            log!("Token {} is not the first token in the exchange.", token_id);
            return amount;
        }

        let token_out = last_exchange.token_out.as_str().parse().unwrap();

        // Refund all the tokens if the token out is not registered
        if !self.registered_tokens.contains(&token_out) {
            log!("Token {} is not registered.", token_out);
            return amount;
        }

        let amount_in = first_exchange.amount_in.clone().parse::<u128>().expect("Failed to parse amount in.");
        let balance = amount - amount_in;

        let fee = balance * get_fee_thousandth() / 1000;
        let new_deposit = amount - fee;
        
        let mut new_swap_routes = swap_routes;
        new_swap_routes.first_mut().unwrap().amount_in = new_deposit.to_string();

        external_promise::ft_transfer_call(token_in.clone(), get_ref_finance_id(), new_deposit, "".to_string()).then(
            external_promise::swap(new_swap_routes, self.owner_id.clone())
        ).then(
            Promise::new(env::current_account_id()).function_call(
                "on_ft_transfer_complete".to_string(),
                serde_json::json!({
                    "amount_in": amount,
                    "sender": sender_id.to_string(),
                    "token_in": token_in.to_string(),
                    "token_out": token_out.to_string()
                }).to_string().as_bytes().to_vec(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(65000000000000)
            )
        );

        return balance;
    }

    #[private]
    pub fn on_ft_transfer_complete(&mut self, amount_in: u128, sender: AccountId, token_in: AccountId, token_out: AccountId) -> Promise {
        log!("Amount in: {}, Sender: {}, Token in: {}, Token out: {}", amount_in, sender, token_in, token_out);
        log!("Promise result count: {}", env::promise_results_count());

        assert!(env::promise_results_count() > 0, "No promise results found.");

        let last_promise_result = env::promise_result(env::promise_results_count() - 1);

        match last_promise_result {
            PromiseResult::Failed => {
                log!("Promise failed.");
                external_promise::withdraw_from_ref(amount_in, token_in.clone())
                .then(
                    external_promise::transfer_ft(token_in, sender, amount_in)
                )
            }
            PromiseResult::Successful(result) => {
                let amount_out = String::from_utf8(result).unwrap().parse::<u128>().unwrap();
                log!("Promise succeed with result {}", amount_out);

                external_promise::withdraw_from_ref(amount_out, token_out.clone())
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
        let integer_part = get_fee_thousandth() / 1000;
        let fractional_part = get_fee_thousandth() % 1000;

        let fractional_part = fractional_part as f64 / 10.0;

        format!("{}.{:02}%", integer_part, fractional_part)
    }

    // Disabled by default to protect privacy of owner
    // pub fn get_owner_id(&self) -> AccountId {
    //     self.owner_id.clone()
    // }
}
