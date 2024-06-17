let version = 0;

export interface PatchNote {
    version: number;
    humanReadableVersion: string;
    date: Date;
    description: string;
}

export const patchNotes: PatchNote[] = [
    {
        version: version++,
        humanReadableVersion: '0.1.0',
        date: new Date('2024-06-17'),
        description: 'Intiial release of contract.',
    },
    {
        version: version++,
        humanReadableVersion: '0.1.1',
        date: new Date('2024-06-17'),
        description: 'Fix the get_fees method returning wrong value.',
    },
    {
        version: version++,
        humanReadableVersion: '0.1.2',
        date: new Date('2024-06-17'),
        description:
            'Fix the problem of assert_full_access having wrong condition.',
    },
    {
        version: version++,
        humanReadableVersion: '0.1.3',
        date: new Date('2024-06-17'),
        description:
            'Fee and ref finance id are now configured via contract intiialise.',
    },
];
