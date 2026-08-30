import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import API_URL from '../config/api';

export interface BusinessArea {
    id: string;
    slug: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    is_active: boolean;
    display_order: number;
    can_edit?: boolean; // present when fetched via user access endpoint
}

interface AreaContextType {
    activeArea: BusinessArea | null;
    userAreas: BusinessArea[];
    setActiveArea: (area: BusinessArea) => void;
    isLoadingAreas: boolean;
    canEditActiveArea: boolean;
    refreshAreas: () => void;
    // Returns the query param string to append to API calls, e.g. "&business_area_id=xxx"
    areaQueryParam: string;
}

const AreaContext = createContext<AreaContextType | undefined>(undefined);

export const AreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [userAreas, setUserAreas] = useState<BusinessArea[]>([]);
    const [activeArea, setActiveAreaState] = useState<BusinessArea | null>(null);
    const [isLoadingAreas, setIsLoadingAreas] = useState(true);

    const fetchAreas = useCallback(async () => {
        if (!token) {
            setUserAreas([]);
            setActiveAreaState(null);
            setIsLoadingAreas(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/areas`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const areas: BusinessArea[] = await res.json();
                setUserAreas(areas);

                // Restore last selected area from localStorage
                const savedSlug = localStorage.getItem('activeAreaSlug');
                const saved = savedSlug ? areas.find(a => a.slug === savedSlug) : null;

                if (saved) {
                    setActiveAreaState(saved);
                } else if (areas.length > 0) {
                    setActiveAreaState(areas[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch areas:', err);
        } finally {
            setIsLoadingAreas(false);
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            fetchAreas();
        } else {
            setUserAreas([]);
            setActiveAreaState(null);
            setIsLoadingAreas(false);
        }
    }, [user, fetchAreas]);

    const setActiveArea = (area: BusinessArea) => {
        setActiveAreaState(area);
        localStorage.setItem('activeAreaSlug', area.slug);
    };

    // For admin (César), can always edit. For others, check can_edit on the area record.
    const canEditActiveArea = user?.role === 'admin' || activeArea?.can_edit === true;

    // Convenience: query param string to append to initiative API calls
    const areaQueryParam = activeArea ? `&business_area_id=${activeArea.id}` : '';

    return (
        <AreaContext.Provider value={{
            activeArea,
            userAreas,
            setActiveArea,
            isLoadingAreas,
            canEditActiveArea,
            refreshAreas: fetchAreas,
            areaQueryParam,
        }}>
            {children}
        </AreaContext.Provider>
    );
};

export const useArea = () => {
    const context = useContext(AreaContext);
    if (!context) throw new Error('useArea must be used within an AreaProvider');
    return context;
};
