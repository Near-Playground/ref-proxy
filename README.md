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

We end up finding that this contracts will not able to cover extreme cases such as:

-   What if the contract owner forget to register storage deposit on behalf of the contract
-   What if the contract owner didn't deposit enough storage deposit into ref exchange on behalf of the contract
-   What if the user didn't deposit storage deposit before swapping with us

Any careless mistake that done by dApp programmers or contract owner when dealing with the contract would cause the funds of users to be lost in the contract.

# What is in our thought?

We will make a v2 contract that have more callbacks, and allow user to temporarily store their balance inside our contract if anything bad happen

# Link to the v2 repo

[Link](https://github.com/Near-Playground/ref-exchange-proxy-v2)
