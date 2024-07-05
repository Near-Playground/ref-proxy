use near_sdk::{env, AccountId, NearToken};

pub fn assert_owner(owner_id: &AccountId) {
    assert_eq!(
        env::predecessor_account_id(),
        owner_id.clone(),
        "Require owner."
    );
}

pub fn assert_full_access() {
    assert!(
        env::attached_deposit() == NearToken::from_yoctonear(1),
        "Requires attached deposit of exactly 1 yoctoNEAR."
    );
}

pub fn assert_owner_and_full_access(owner_id: &AccountId) {
    assert_owner(owner_id);
    assert_full_access();
}
