use near_sdk::AccountId;

pub fn get_fee_thousandth() -> u128 {
    std::env::var("FEE_THOUSANDTH").unwrap_or("2".to_string()).parse().unwrap()
}

pub fn get_ref_finance_id() -> AccountId {
    std::env::var("REF_FINANCE_ID").unwrap_or("v2.ref-finance.near".to_string()).parse().unwrap()
}