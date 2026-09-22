import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
    name?: string;
    imageUrl?: string | null;
    size?: AvatarSize;
    className?: string;
    title?: string;
    showBorder?: boolean;
}

const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'U';

    let clean = name.trim();
    // Si es correo electrónico, usamos la parte previa al dominio
    if (clean.includes('@')) {
        clean = clean.split('@')[0];
        clean = clean.replace(/[._-]+/g, ' ');
    }

    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) {
        // Una sola palabra: primera letra
        return parts[0][0].toUpperCase();
    }
    // Dos o más palabras: inicial primera y segunda palabra
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getBackgroundGradient = (seed: string): string => {
    const gradients = [
        'from-indigo-500 to-purple-600',
        'from-blue-600 to-indigo-700',
        'from-emerald-500 to-teal-700',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-violet-600 to-fuchsia-600',
        'from-teal-500 to-cyan-600'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
    xs: { container: 'w-5 h-5 min-w-[20px]', text: 'text-[9px]' },
    sm: { container: 'w-7 h-7 min-w-[28px]', text: 'text-[11px]' },
    md: { container: 'w-9 h-9 min-w-[36px]', text: 'text-xs' },
    lg: { container: 'w-12 h-12 min-w-[48px]', text: 'text-sm' },
    xl: { container: 'w-16 h-16 min-w-[64px]', text: 'text-lg' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
    name,
    imageUrl,
    size = 'md',
    className,
    title,
    showBorder = true,
}) => {
    const [hasError, setHasError] = useState(false);

    // Resetear error cuando cambia la URL de la imagen
    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    const initials = getInitials(name);
    const gradient = getBackgroundGradient(name || initials);
    const sizeConfig = sizeClasses[size] || sizeClasses.md;
    const hasValidImage = Boolean(imageUrl && imageUrl.trim() && !hasError);

    return (
        <div
            title={title || name || 'Usuario'}
            className={clsx(
                'relative rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden select-none',
                sizeConfig.container,
                showBorder && 'ring-2 ring-white/10 dark:ring-white/10 shadow-sm',
                className
            )}
        >
            {hasValidImage ? (
                <img
                    src={imageUrl!.trim()}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div
                    className={clsx(
                        'w-full h-full rounded-full flex items-center justify-center font-bold text-white uppercase tracking-wider bg-gradient-to-br',
                        gradient,
                        sizeConfig.text
                    )}
                >
                    {initials}
                </div>
            )}
        </div>
    );
};
