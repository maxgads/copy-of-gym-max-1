import { useState, useCallback, useEffect } from 'react';
import * as routineService from '../../services/routineService';
import { Day } from '../../types';

export const useQuickView = (userId: string) => {
    const [selectedInfo, setSelectedInfo] = useState<{ routineId: string; dayId: string; routineName: string; dayName: string; } | null>(null);
    const [dayDetails, setDayDetails] = useState<Day | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedInfo || !userId) {
                setDayDetails(null);
                return;
            }
            setIsLoading(true);
            try {
                const routine = await routineService.getRoutineById(userId, selectedInfo.routineId);
                const day = routine?.days.find(d => d.id === selectedInfo.dayId);
                setDayDetails(day || null);
            } catch (error) {
                console.error("Error fetching quick view details:", error);
                setDayDetails(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [selectedInfo, userId]);

    const selectDayForQuickView = useCallback(async (routineId: string, dayId: string) => {
        // This is a simplified version. The full logic lives in InicioView to set the state.
        // This function will now be responsible for setting the `selectedInfo` state.
        setIsLoading(true);
        try {
            const routine = await routineService.getRoutineById(userId, routineId);
            const day = routine?.days.find(d => d.id === dayId);
            if (routine && day) {
                setSelectedInfo({
                    routineId,
                    dayId,
                    routineName: routine.name,
                    dayName: day.name || `Día ${day.order + 1}`
                });
            } else {
                setSelectedInfo(null);
            }
        } catch (error) {
            console.error("Error setting up quick view:", error);
            setSelectedInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const closeQuickView = useCallback(() => {
        setSelectedInfo(null);
    }, []);

    return {
        isQuickViewActive: selectedInfo != null,
        quickViewDayDetails: dayDetails,
        isLoadingQuickView: isLoading,
        selectedDayForQuickViewInfo: selectedInfo,
        selectDayForQuickView,
        closeQuickView,
    };
};
