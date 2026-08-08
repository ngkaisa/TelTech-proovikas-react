import { Header } from '@TalTech-IT/styleguide';
import { forwardRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROLE_LABELS, ROLES, useRole } from '../context/RoleContext';

/**
 * LinkBehaviour — CVI Header React Router integratsiooni adapter.
 * Edastab href → to ja kasutab NavLink active class automaatikaga.
 */
const LinkBehaviour = forwardRef(function LinkBehaviour({ href, children, ...rest }, ref) {
    if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto')) {
        return <a href={href} ref={ref} {...rest}>{children}</a>;
    }
    return (
        <NavLink
            to={href}
            ref={ref}
            className={({ isActive }) => {
                const base = rest.className || '';
                return isActive ? `${base} tt-header__level2-link--active`.trim() : base;
            }}
            {...rest}
        >
            {children}
        </NavLink>
    );
});

// Demo rollid → CVI roles prop vajalikule kujule (number key)
const DEMO_ROLES_MAP = [
    { key: 0, label: 'Külastaja',             value: ROLES.GUEST },
    { key: 1, label: 'Tudeng',                value: ROLES.TUDENG },
    { key: 2, label: 'Töötaja / õppejõud',   value: ROLES.TOOTAJA },
    { key: 3, label: 'Väline kasutaja',       value: ROLES.EXT },
    { key: 4, label: 'Ruumi haldur',          value: ROLES.HALDUR },
    { key: 5, label: 'Superkasutaja',         value: ROLES.SUPER },
];

function roleKeyFor(roleValue) {
    return DEMO_ROLES_MAP.find(r => r.value === roleValue)?.key ?? 0;
}

export default function AppTopbar() {
    const { currentRole, isLoggedIn, setRole,
            canSeeFullStatistics, canSeeOwnBookings, isExt } = useRole();
    const navigate = useNavigate();

    // Navigatsioonilingid — role-aware
    const navItems = [
        { children: 'Otsi ruumi', href: '/otsi-ruumi' },
        ...(canSeeOwnBookings && !canSeeFullStatistics ? [
            { children: 'Broneeringud', href: '/broneeringud' },
            { children: 'Taotlused',    href: '/taotlused' },
        ] : []),
        ...(canSeeOwnBookings && canSeeFullStatistics ? [
            { children: 'Broneeringud', href: '/broneeringud' },
            { children: 'Broneeringute haldus', href: '/taotlused' },
        ] : []),
        ...(isExt && !canSeeOwnBookings ? [
            { children: 'Taotlused', href: '/taotlused' },
        ] : []),
        ...(canSeeFullStatistics ? [
            { children: 'Statistika', href: '/statistika' },
        ] : []),
    ];

    const links = [
        {
            active: true,
            children: 'BRON',
            href: '/',
            items: navItems,
        },
        {
            children: 'ÕIS',
            href: 'https://ois2.ttu.ee',
            target: '_blank',
        },
        {
            children: 'Moodle',
            href: 'https://moodle.taltech.ee',
            target: '_blank',
        },
    ];

    const rolesProps = {
        activeRole: roleKeyFor(currentRole),
        availableRoles: DEMO_ROLES_MAP.map(({ key, label }) => ({ key, label })),
        onSelectRole: (key) => {
            const found = DEMO_ROLES_MAP.find(r => r.key === key);
            if (found) setRole(found.value);
        },
    };

    const loginProps = isLoggedIn ? undefined : {
        label: 'Logi sisse',
        onClick: () => setRole(ROLES.TUDENG),
    };

    const profileProps = isLoggedIn ? {
        profile: {
            firstName: 'Mari',
            lastName: 'Maasikas',
        },
        onLogout: () => setRole(ROLES.GUEST),
        links: canSeeOwnBookings ? [
            { children: 'Minu broneeringud', href: '/broneeringud' },
            { children: 'Minu taotlused',    href: '/taotlused' },
        ] : [],
    } : undefined;

    return (
        <Header
            linkAs={LinkBehaviour}
            links={links}
            logoLink={{ href: '/', children: 'BRON — TalTech ruumibroneerimissüsteem' }}
            skipLink={{ href: '#main-content', children: 'Liigu põhisisuni' }}
            roles={rolesProps}
            login={loginProps}
            profile={profileProps}
            slogan="Ruumibroneerimissüsteem"
        />
    );
}
