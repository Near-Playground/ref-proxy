use crate::TokenExchange;
use near_sdk::{serde_json, AccountId, Gas, NearToken, Promise};

pub fn register_tokens(token_ids: Vec<AccountId>, ref_finance_id: AccountId) -> Promise {
    let args = serde_json::json!({
        "token_ids": token_ids.clone()
    }).to_string().as_bytes().to_vec();

    Promise::new(ref_finance_id).function_call(
        "register_tokens".to_string(),
        args,
        NearToken::from_yoctonear(1),
        Gas::from_tgas(50)
    )
}

pub fn withdraw_from_ref(amount: String, token_id: AccountId, ref_finance_id: AccountId) -> Promise {
    Promise::new(ref_finance_id).function_call(
        "withdraw".to_string(), 
        serde_json::json!({
            "amount": amount,
            "token_id": token_id.to_string(),
        }).to_string().as_bytes().to_vec(),
        NearToken::from_yoctonear(1),
        Gas::from_tgas(50)
    )
}

pub fn transfer_ft(token_id: AccountId, receiver_id: AccountId, amount: String) -> Promise {
    Promise::new(token_id).function_call(
        "ft_transfer".to_string(), 
        serde_json::json!({
            "receiver_id": receiver_id,
            "amount": amount,
            "memo": null
        }).to_string().as_bytes().to_vec(),
        NearToken::from_yoctonear(1),
        Gas::from_tgas(10)
    )
}

pub fn ft_transfer_call(token_id: AccountId, receiver_id: AccountId, amount: String, msg: String) -> Promise {
    Promise::new(token_id).function_call(
        "ft_transfer_call".to_string(),
        serde_json::json!({
            "amount": amount,
            "msg": msg,
            "receiver_id": receiver_id.to_string()}
        ).to_string().as_bytes().to_vec(),
        NearToken::from_yoctonear(1),
        Gas::from_tgas(50)
    )
}

pub fn swap(swap_action_routes: Vec<TokenExchange>, refferal_id: AccountId, ref_finance_id: AccountId) -> Promise {
    Promise::new(ref_finance_id).function_call(
        "swap".to_string(),
        serde_json::json!({
            "actions": swap_action_routes,
            "referral_id": refferal_id
        }).to_string().as_bytes().to_vec(),
        NearToken::from_yoctonear(1),
        Gas::from_tgas(80)
    )
}