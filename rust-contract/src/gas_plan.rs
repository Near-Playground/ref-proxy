use crate::Gas;

pub const INTERNAL_GAS_ALLOWANCE: u64 = 2;
pub const EXTERNAL_GAS_ALLOWANCE: u64 = 1;

/**
 * External gas allowance is used for the gas that is used by the external calls.
 * 
 * External contracts usually have predictable gas usage, so we can use a lower gas allowance.
 */

// 30 Tgas - ft_transfer_call & ft_resolve_transfer in FT contract, source: https://github.dev/near/near-sdk-rs/blob/master/near-contract-standards/src/fungible_token/core_impl.rs
// 3.61 Tgas - ft_on_transfer in ref finance contract
pub const GAS_FOR_FT_TRANSFER_CALL: Gas = Gas::from_tgas((30 + 5) * EXTERNAL_GAS_ALLOWANCE);

// 4.32 Tgas - withdraw in Ref Finance
// 20 Tgas - GAS_FOR_FT_TRANSFER, source: https://github.dev/ref-finance/ref-contracts/tree/main/ref-exchange
// 20 Tgas - GAS_FOR_RESOLVE_TRANSFER, source: https://github.dev/ref-finance/ref-contracts/tree/main/ref-exchange
pub const GAS_FOR_REF_FINANCE_WITHDRAW: Gas = Gas::from_tgas((6 + 20 + 20) * EXTERNAL_GAS_ALLOWANCE);

// 6.04 Tgas - swap in Ref Finance
pub const GAS_FOR_REF_FINANCE_SWAP: Gas = Gas::from_tgas(8 * EXTERNAL_GAS_ALLOWANCE);

// 2.54 Tgas - ft_transfer in FT contract
pub const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(4 * EXTERNAL_GAS_ALLOWANCE);

/**
 * Internal gas allowance is used for the gas that is used by the internal calls.
 * 
 * Internal calls might have gas usage changes based on the code, so we can use a higher gas allowance.
 */
// 3.95 Tgas - on_ft_transfer_complete in our contract
pub const GAS_FOR_ON_FT_TRANSFER_COMPLETE: Gas = Gas::from_tgas(4 * INTERNAL_GAS_ALLOWANCE + GAS_FOR_REF_FINANCE_WITHDRAW.as_tgas() + GAS_FOR_FT_TRANSFER.as_tgas());

// 5.43 Tgas - ft_on_transfer in our contract
pub const GAS_FOR_FT_ON_TRANSFER: Gas = Gas::from_tgas(6 * INTERNAL_GAS_ALLOWANCE + GAS_FOR_FT_TRANSFER_CALL.as_tgas() + GAS_FOR_REF_FINANCE_SWAP.as_tgas() + GAS_FOR_ON_FT_TRANSFER_COMPLETE.as_tgas());



