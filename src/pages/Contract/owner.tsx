import React from 'preact/compat';
import { ContractAccountId } from '../../components/ContractAccountId';
import {
    contractAccountId,
    contractVersion,
    deployContract,
    refreshContractVersion,
    updateContract,
} from '../../signals/contract';
import { accountState, activeAccount, wallet } from '../../signals/wallet';
import BN from 'bn.js';
import { KeyPairEd25519 } from 'near-api-js/lib/utils';
import { useQuery } from '@tanstack/react-query';
import * as nearAPI from 'near-api-js';
import { z } from 'zod';
import { Transaction } from '@near-wallet-selector/core';
import { patchNotes } from '../../data/patch-note';

interface TokenDetail {
    tokenId: string;
    symbol: string;
    balance: string;
}

// https://nomicon.io/Standards/Tokens/FungibleToken/Metadata
const zFungibleTokenMetadata = z.object({
    spec: z.string(),
    name: z.string(),
    symbol: z.string(),
    icon: z.union([z.string(), z.null()]),
    reference: z.union([z.string(), z.null()]),
    reference_hash: z.union([z.string(), z.null()]),
    decimals: z.number(),
});

export function ContractOwner() {
    const [createAccountError, setCreateAccountError] = React.useState<
        string | null
    >(null);
    const [addTokenIds, setAddTokenIds] = React.useState<string>('');

    const {
        version,
        humanReadableVersion,
        accountExists,
        contractDeployed,
        owner,
    } = contractVersion.value ?? {};

    const latestPatch = patchNotes[patchNotes.length - 1];

    async function addTokens() {
        if (!wallet.value) {
            return;
        }

        if (!contractAccountId.value) {
            return;
        }

        if (!activeAccount.value) {
            return;
        }

        const tokenIds = addTokenIds.split(',').map((x) => x.trim());

        await wallet.value.signAndSendTransactions({
            transactions: [
                ...tokenIds.map(
                    (tokenId): Transaction => ({
                        signerId: activeAccount.value?.accountId ?? '',
                        receiverId: tokenId,
                        actions: [
                            {
                                type: 'FunctionCall',
                                params: {
                                    methodName: 'storage_deposit',
                                    args: {
                                        account_id: contractAccountId.value,
                                        registration_only: true,
                                    },
                                    gas: '300000000000000',
                                    deposit:
                                        nearAPI.utils.format.parseNearAmount(
                                            '0.0125'
                                        )!,
                                },
                            },
                        ],
                    })
                ),
                {
                    signerId: activeAccount.value?.accountId ?? '',
                    receiverId: contractAccountId.value,
                    actions: [
                        {
                            type: 'FunctionCall',
                            params: {
                                methodName: 'register_tokens',
                                args: {
                                    token_ids: tokenIds,
                                },
                                gas: '300000000000000',
                                deposit: '1',
                            },
                        },
                    ],
                },
            ],
            callbackUrl: window.location.href,
        });
    }

    const tokens = useQuery({
        queryKey: ['tokens'],
        queryFn: async () => {
            console.log('fetching tokens');

            const near = await nearAPI.connect({
                networkId: 'testnet',
                nodeUrl: 'https://rpc.testnet.near.org',
            });

            const contract = await near.account(contractAccountId.value);

            const tokenIds = await contract
                .viewFunction({
                    contractId: contractAccountId.value,
                    methodName: 'get_registered_tokens',
                    args: {},
                })
                .then((res) => z.array(z.string()).parse(res));

            const tokenPromises = tokenIds.map(
                (tokenId): Promise<TokenDetail> => {
                    return Promise.all([
                        contract
                            .viewFunction({
                                contractId: tokenId,
                                methodName: 'ft_metadata',
                                args: {},
                            })
                            .then((res) => zFungibleTokenMetadata.parse(res)),
                        contract
                            .viewFunction({
                                contractId: 'ref-finance-101.testnet',
                                methodName: 'get_deposit',
                                args: {
                                    account_id: contractAccountId.value,
                                    token_id: tokenId,
                                },
                            })
                            .then((res) => z.string().parse(res))
                            .then((res) => new BN(res)),
                    ]).then(([metadata, balance]) => {
                        return {
                            tokenId,
                            symbol: metadata.symbol,
                            balance: balance
                                .div(new BN(10).pow(new BN(metadata.decimals)))
                                .toString(),
                        };
                    });
                }
            );

            const tokens = await Promise.all(tokenPromises);

            return tokens;
        },
        enabled: version !== -1,
    });

    async function createAccount() {
        setCreateAccountError(null);

        if (!wallet.value) {
            return;
        }

        if (!contractAccountId.value) {
            return;
        }

        if (!activeAccount.value) {
            return;
        }

        if (
            !contractAccountId.value.endsWith(
                `.${activeAccount.value.accountId}`
            )
        ) {
            setCreateAccountError(
                'Contract account id must end with your account id'
            );
            return;
        }

        const accountBalance = new BN(accountState.value?.amount ?? '0');

        // 10e24
        if (!accountBalance.gt(new BN('10000000000000000000000000'))) {
            setCreateAccountError(
                'Insufficient balance to deploy contract, need 10 Near'
            );
            return;
        }

        const keypair = KeyPairEd25519.fromRandom();
        const privateKey = keypair.secretKey;

        localStorage.setItem(
            `privateKey:${contractAccountId.value}`,
            privateKey.toString()
        );

        const publicKey = keypair.publicKey.toString();

        try {
            await wallet.value.signAndSendTransactions({
                transactions: [
                    {
                        signerId: activeAccount.value.accountId,
                        receiverId: contractAccountId.value,
                        actions: [
                            {
                                type: 'CreateAccount',
                            },
                            {
                                type: 'AddKey',
                                params: {
                                    publicKey,
                                    accessKey: {
                                        permission: 'FullAccess',
                                    },
                                },
                            },
                            {
                                type: 'Transfer',
                                params: {
                                    deposit:
                                        nearAPI.utils.format.parseNearAmount(
                                            '9'
                                        )!,
                                },
                            },
                        ],
                    },
                    {
                        signerId: activeAccount.value?.accountId ?? '',
                        receiverId: 'ref-finance-101.testnet',
                        actions: [
                            {
                                type: 'FunctionCall',
                                params: {
                                    methodName: 'storage_deposit',
                                    args: {
                                        account_id: contractAccountId.value,
                                    },
                                    gas: '300000000000000',
                                    deposit:
                                        nearAPI.utils.format.parseNearAmount(
                                            '1'
                                        )!,
                                },
                            },
                        ],
                    },
                ],
                callbackUrl: window.location.href,
            });

            refreshContractVersion();

            return;
        } catch (err: unknown) {
            setCreateAccountError(JSON.stringify(err));
            return;
        }
    }

    return (
        <div class='container mx-auto px-4'>
            <h1 class='text-xl mt-8 mb-5'>Deploy Contract</h1>
            <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
            <p class='my-5'>
                Give us the account id of the contract, or type a new one if you
                want to create a new contract. Your new address must ends with
                `.{activeAccount.value?.accountId}`
            </p>
            <ContractAccountId />
            {!accountExists && (
                <>
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <button
                        type='button'
                        onClick={createAccount}
                        class='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
                    >
                        Create Account
                    </button>
                    {createAccountError && (
                        <p class='text-red-600 dark:text-red-400'>
                            {createAccountError}
                        </p>
                    )}
                </>
            )}
            {accountExists && !contractDeployed && (
                <>
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <h2 class='text-lg mt-8 mb-5'>Fresh account found!</h2>
                    <button
                        type='button'
                        onClick={deployContract}
                        class='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
                    >
                        Deploy Contract
                    </button>
                </>
            )}
            {version !== -1 && (
                <>
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <h2 class='text-lg mt-8 mb-5'>Contract Metadata</h2>
                    <p class='my-5 dark:text-green-300 text-green-700'>
                        Recognised contract detected!
                    </p>
                    <p class='my-5'>Contract version: {humanReadableVersion}</p>
                    <p class='my-5'>
                        Latest Patch: {latestPatch.humanReadableVersion}
                        {latestPatch.version !== version && (
                            <>
                                [&nbsp;
                                <a
                                    href='#'
                                    onClick={(e) => {
                                        e.preventDefault();

                                        updateContract();
                                    }}
                                >
                                    Update Contract
                                </a>
                                &nbsp;]
                            </>
                        )}
                    </p>
                    <p class='my-5'>Contract owner: {owner}</p>
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <h2 class='text-lg mt-8 mb-5'>Registered Tokens</h2>
                    {tokens.isLoading && <p>Loading tokens...</p>}
                    {tokens.isError && <p>Error loading tokens</p>}
                    {tokens.isSuccess &&
                        tokens.data.map((token) => (
                            <p class='my-5' key={token.tokenId}>
                                {token.symbol}({token.tokenId}): {token.balance}
                            </p>
                        ))}
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <h2 class='text-lg mt-8 mb-5'>Add Tokens</h2>
                    <div class='my-5'>
                        <label
                            for='contractAddTokens'
                            class='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                        >
                            Comma Separated Token Account Ids
                        </label>
                        <input
                            id='contractAddTokens'
                            type='text'
                            class='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                            placeholder='wrap.testnet, usdt.fakes.testnet'
                            value={addTokenIds}
                            onInput={(e) => {
                                setAddTokenIds(
                                    (e.target as HTMLInputElement).value
                                );
                            }}
                            required
                        />
                    </div>
                    <button
                        type='button'
                        onClick={addTokens}
                        class='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
                    >
                        Add Tokens
                    </button>
                </>
            )}
            {version === -1 && accountExists && contractDeployed && (
                <>
                    <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
                    <h2 class='text-lg mt-8 mb-5'>Contract Metadata</h2>
                    <p class='my-5 dark:text-red-300 text-red-700'>
                        Contract not recognised!
                    </p>
                    <p class='my-5'>
                        Account Exists: {accountExists ? 'Yes' : 'No'}
                    </p>
                    <p class='my-5'>
                        Contract Deployed: {contractDeployed ? 'Yes' : 'No'}
                    </p>
                    <p class='my-5'>Contract owner: {owner}</p>
                </>
            )}
        </div>
    );
}
