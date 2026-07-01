export let gyroBeta = 0;
export let gyroGamma = 0;

export let gyroBetaZero = 0;
export let gyroGammaZero = 0;

export let gyroEnabled = false;
export let gyroCalibrated = false;

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export function resetCalibration() {
    gyroCalibrated = false;
}

export function requestGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(perm => {
                if (perm === 'granted') {
                    enableGyro();
                    // enableMotion();
                }
            }).catch(console.error);
    } else if (isMobile) {
        enableGyro();
        // enableMotion();
    }
}

function enableGyro() {
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null && e.gamma !== null) {
            if (!gyroCalibrated) {
                gyroBetaZero = e.beta || 0;
                gyroGammaZero = e.gamma || 0;
                gyroCalibrated = true;
            }
            gyroBeta = e.beta || 0;
            gyroGamma = e.gamma || 0;
            gyroEnabled = true;

            const dBeta = gyroBeta - gyroBetaZero;
            const dGamma = gyroGamma - gyroGammaZero;
            document.getElementById('gyro-indicator').textContent =

                `絶対値:β${e.beta.toFixed(1)}° γ${e.gamma.toFixed(1)}°,ゼロ点: β${gyroBetaZero.toFixed(1)}° γ${gyroGammaZero.toFixed(1)}°, 差分: β${dBeta.toFixed(1)}° γ${dGamma.toFixed(1)}°`;
        }
    }, true);
}
