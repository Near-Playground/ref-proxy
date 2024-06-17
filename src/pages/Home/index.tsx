import preactLogo from '../../assets/preact.svg';

export function Home() {
    return (
        <div class='container mx-auto px-4'>
            <h1 class='text-xl mt-8 mb-5'>Introduction</h1>
            <p class='my-5'>
                This is a simple contract to demonstrate how we can build a
                proxy contract to interface with ref-finance swap contract.
            </p>
            <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
            <h1 class='text-lg my-5'>To become a contract owner</h1>
            <p class='my-5'>
                To become a contract owner, click [&nbsp;
                <a
                    href='/contract/owner'
                    class='text-blue-600 dark:text-blue-400 hover:underline'
                >
                    here
                </a>
                &nbsp;]. This will brings you to a wizard to help you to setup
                the contract.
            </p>
            <hr class='h-1 my-5 bg-gray-400 dark:bg-gray-600' />
            <h1 class='text-lg my-5'>To become a contract user</h1>
            <p class='my-5'>
                To use the contract, click [&nbsp;
                <a
                    href='/contract/user'
                    class='text-blue-600 dark:text-blue-400 hover:underline'
                >
                    here
                </a>
                &nbsp;]. This will brings you to a page to help you to use the
                contract.
            </p>
        </div>
    );
}
