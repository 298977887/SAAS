
import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

const useDevice = (): DeviceType => {
    const [device, setDevice] = useState<DeviceType>('desktop');

    const updateDevice = () => {
        const width = window.innerWidth;
        if (width < 768) {
            setDevice('mobile'); // 手机
        } else if (width >= 768 && width < 992) {
            setDevice('tablet'); // 平板
        } else {
            setDevice('desktop'); // 桌面
        }
    };

    useEffect(() => {
        updateDevice();
        window.addEventListener('resize', updateDevice);
        return () => window.removeEventListener('resize', updateDevice);
    }, []);

    return device;
};

export default useDevice;
