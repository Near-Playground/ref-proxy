import { min } from 'bn.js';
import { contractAccountId } from '../../signals/contract';
import { activeAccount, wallet } from '../../signals/wallet';
import * as nearAPI from 'near-api-js';

export function ContractUser() {
    async function swapTokenNormalFlow() {
        wallet.value?.signAndSendTransactions({
            transactions: [
                {
                    signerId: activeAccount.value?.accountId ?? '',
                    receiverId: 'usdt.fakes.testnet',
                    actions: [
                        {
                            type: 'FunctionCall',
                            params: {
                                methodName: 'storage_deposit',
                                args: {
                                    account_id: activeAccount.value?.accountId,
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
                },
                {
                    signerId: activeAccount.value?.accountId ?? '',
                    receiverId: 'wrap.testnet',
                    actions: [
                        {
                            type: 'FunctionCall',
                            params: {
                                methodName: 'storage_deposit',
                                args: {
                                    account_id: activeAccount.value?.accountId,
                                    registration_only: true,
                                },
                                gas: '100000000000000',
                                deposit:
                                    nearAPI.utils.format.parseNearAmount(
                                        '0.0125'
                                    )!,
                            },
                        },
                        {
                            type: 'FunctionCall',
                            params: {
                                methodName: 'near_deposit',
                                args: {},
                                gas: '100000000000000',
                                deposit:
                                    nearAPI.utils.format.parseNearAmount(
                                        '0.01'
                                    )!,
                            },
                        },
                    ],
                },
                {
                    signerId: activeAccount.value?.accountId ?? '',
                    receiverId: 'wrap.testnet',
                    actions: [
                        {
                            type: 'FunctionCall',
                            params: {
                                methodName: 'ft_transfer_call',
                                args: {
                                    receiver_id: contractAccountId.value,
                                    amount: nearAPI.utils.format.parseNearAmount(
                                        '0.01'
                                    )!,
                                    msg: JSON.stringify({
                                        actions: [
                                            {
                                                pool_id: 34,
                                                token_in: 'wrap.testnet',
                                                token_out: 'usdt.fakes.testnet',
                                                amount_in:
                                                    nearAPI.utils.format.parseNearAmount(
                                                        '0.01'
                                                    )!,
                                                min_amount_out: '1',
                                            },
                                        ],
                                    }),
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

    return (
        <div class='container mx-auto px-4'>
            <h1 class='text-xl mt-8 mb-5'>Contract User</h1>
            <p class='mb-5'>
                This page is for users of the contract. It will allow you to
                interact with the contract and view the contract's state.
            </p>
            <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
            <button
                type='button'
                onClick={swapTokenNormalFlow}
                class='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
            >
                Swap Token Normal Flow
            </button>
        </div>
    );
}
