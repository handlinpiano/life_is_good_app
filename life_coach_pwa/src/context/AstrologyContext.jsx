import { createContext, useContext, useState } from 'react';
import { calculateChart, calculateDasha, calculateSynastry } from '../utils/api';

const AstrologyContext = createContext();

export function AstrologyProvider({ children }) {
    const [chart, setChart] = useState(() => JSON.parse(localStorage.getItem('user_chart')) || null);
    const [dasha, setDasha] = useState(() => JSON.parse(localStorage.getItem('user_dasha')) || null);
    const [birthData, setBirthData] = useState(() => JSON.parse(localStorage.getItem('user_birth_data')) || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [partnerData, setPartnerData] = useState(() => JSON.parse(localStorage.getItem('partner_data')) || null);
    const [synastryData, setSynastryData] = useState(() => JSON.parse(localStorage.getItem('synastry_data')) || null);

    const calculateBirthChart = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const [chartResult, dashaResult] = await Promise.all([
                calculateChart(data),
                calculateDasha(data),
            ]);
            setChart(chartResult);
            setDasha(dashaResult);
            setBirthData(data);

            // Persist
            localStorage.setItem('user_chart', JSON.stringify(chartResult));
            localStorage.setItem('user_dasha', JSON.stringify(dashaResult));
            localStorage.setItem('user_birth_data', JSON.stringify(data));

            return true;
        } catch (err) {
            setError(err.message || 'Failed to calculate chart');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const calculateCompatibility = async (partner) => {
        setLoading(true);
        setError(null);
        try {
            const people = [
                { label: 'You', birth_data: birthData },
                { label: 'Partner', birth_data: partner }
            ];
            const result = await calculateSynastry(people);

            if (result.success) {
                setSynastryData(result);
                setPartnerData(partner);
                return true;
            } else {
                setError(result.error || 'Failed to calculate compatibility');
                return false;
            }
        } catch (err) {
            setError(err.message || 'Failed to calculate compatibility');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AstrologyContext.Provider
            value={{
                chart,
                dasha,
                birthData,
                partnerData,
                synastryData,
                loading,
                error,
                calculateBirthChart,
                calculateCompatibility,
            }}
        >
            {children}
        </AstrologyContext.Provider>
    );
}

export function useAstrology() {
    return useContext(AstrologyContext);
}
