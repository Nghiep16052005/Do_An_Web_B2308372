document.addEventListener('DOMContentLoaded', () => {
    const zoomWrap = document.querySelector('.product-zoom-wrapper');
    const img = document.querySelector('.product-gallery-main');
    const lens = document.querySelector('.product-zoom-lens');

    if (!zoomWrap || !img || !lens) {
        return;
    }

    const zoomFactor = 1.8;

    function moveLens(event) {
        const rect = zoomWrap.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const lensSize = lens.offsetWidth;
        const maxX = rect.width - lensSize / 2;
        const maxY = rect.height - lensSize / 2;

        const lensX = Math.min(Math.max(x, lensSize / 2), maxX);
        const lensY = Math.min(Math.max(y, lensSize / 2), maxY);

        lens.style.left = `${lensX}px`;
        lens.style.top = `${lensY}px`;

        const imgRatioX = (lensX / rect.width) * 100;
        const imgRatioY = (lensY / rect.height) * 100;
        const bgX = (img.width * zoomFactor - rect.width) * (lensX / rect.width);
        const bgY = (img.height * zoomFactor - rect.height) * (lensY / rect.height);

        img.style.transformOrigin = `${imgRatioX}% ${imgRatioY}%`;
        lens.style.backgroundImage = `url('${img.src}')`;
        lens.style.backgroundSize = `${img.width * zoomFactor}px ${img.height * zoomFactor}px`;
        lens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    }

    zoomWrap.addEventListener('mousemove', moveLens);
    zoomWrap.addEventListener('mouseleave', () => {
        lens.style.opacity = '0';
    });
    zoomWrap.addEventListener('mouseenter', () => {
        lens.style.opacity = '1';
    });
});
