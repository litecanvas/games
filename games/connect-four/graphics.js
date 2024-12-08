function makeGraphics(engine) {
    const res = {};

    res.selector = engine.paint(60, 60, (ctx) => {
        const w = ctx.canvas.width,
            h = ctx.canvas.height;

        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w, 21);
        ctx.lineTo(w / 2, h * 0.7);
        ctx.closePath();

        engine.fill(3);
    });

    return res;
}
