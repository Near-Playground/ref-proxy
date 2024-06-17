import { contractAccountId } from '../signals/contract';
import { activeAccount } from '../signals/wallet';

export function ContractAccountId() {
    return (
        <>
            <div class='my-5'>
                <label
                    for='contractAccountId'
                    class='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                    Contract Account Id
                </label>
                <input
                    id='contractAccountId'
                    type='text'
                    class='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    placeholder={
                        activeAccount.value
                            ? `xxxx.${activeAccount.value.accountId}`
                            : 'ref-proxy.near-playground.testnet'
                    }
                    value={contractAccountId.value ?? ''}
                    onInput={(e) => {
                        contractAccountId.value = (
                            e.target as HTMLInputElement
                        ).value;
                    }}
                    required
                />
            </div>
        </>
    );
}
