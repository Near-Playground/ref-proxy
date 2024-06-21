# Abandoned

This project is already abandoned.

# Introduction

This project aimed to create a clone of the proxy contract used by hot wallets to swap tokens for users. The ideas for this project were inspired by the `ref.hot.tg` smart contract.

# Progress

We successfully developed a smart contract that swaps wrapped testnet Near to testnet USDT.
[Execution Details](https://testnet.nearblocks.io/txns/A7DpSDaF4gbzz6AfhEgxm9UEAtUWZ1EjEk3tcjnF4H7x?tab=execution)

The execution flow of our contract is very similar to `ref.hot.tg`.
[Execution Flow](https://nearblocks.io/txns/C4r6fKf2CdnsJE3kofDNtG9fTnWMnKWCknPr5BiPhGf6?tab=execution)

Both contracts look similar because we based our work on how `ref.hot.tg` operates.

# Challenges Faced

-   Our contract could not support the `Auto Routing` feature.
-   `Auto Routing` means when there's no direct approach to swap from `tokenA` to `tokenC`, or when the direct approach is too expensive, we swap from `tokenA` to `tokenB`, then to `tokenC`.
-   The problem arises when the swap from `tokenA` to `tokenB` succeeds, but the swap from `tokenB` to `tokenC` fails. We end up with our balance stored in ref finance converted to `tokenB`, but we aim to refund `tokenA`.

# How We Solved This Issue

-   We addressed this issue by disabling the `Auto Routing` feature in commit [e19f7e](https://github.com/Near-Playground/ref-proxy/pull/5/commits/e19f7e7bc292edd01cb10700e1af5e67f4b16d27#diff-7d5ca1472de60e3bdd5e8baa39f04f69aaf6ea98df66b0a959f6fca8b3598867).

# How Hot Wallet Solved This Issue

-   Hot wallet appears to solve this issue by setting the `min_amount_out` to `0`, which is essentially `100% slippage`.
-   A swap with 100% slippage can't fail, thus the challenges we discussed earlier are irrelevant.
-   [Reference](https://nearblocks.io/txns/6rmHLCW4J54DZcDGoTDnmkj3hRoMucggiwUyYoRwc1ag?tab=execution)

# Why We Decided to Abandon This Project

-   Both `disabling auto routing` and `100% slippage` are not good solutions for swapping.
-   Disabling auto routing can lead to `no swap routes found`, or sometimes huge `price impact`.
-   100% slippage is risky. If the price fluctuates significantly since the last estimation, users might end up with very poor swap results.

# Our Thoughts

-   We should start this project from scratch again, using a new approach to solve the issue.
-   `Registered Tokens` will be removed when restarting. Most `Auto Routing` features don't have limited token pools. If our swap halts halfway, we will end up with new tokens, violating the reason for having `registered tokens`. Moreover, there's no reason to limit the tokens that users can swap to a pool we select.
-   We need to publish an npm library for JavaScript projects to interact with the smart contract. Developers will pass in the `Auto Routing plan`, and our library will provide an array of `transactions` to be signed. We will ensure users register storage deposits for every FT `in between` the auto routing, so if the swapping fails halfway, we can refund the FT to users without worrying about failures.
