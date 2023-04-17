precision mediump float;

#define PI 3.14159 // pi for gaussian/hsb
#define SIGMA 0.84089642 // sigma constant for gaussian

#define INNER_RADIUS 160.0
#define RADIUS 200.0

#define SHADOW_RADIUS 60.0
#define INNER_SHADOW_RADIUS 10.0

#define FADE_BUFFER 2.0
#define GAUSSIAN_KERNEL_WIDTH 3.0

float gaussian(float x, float y) {
    return 1.0 / (2.0 * PI * pow(SIGMA, 2.0)) * exp(-(pow(x, 2.0) + pow(y, 2.0)) / (2.0 * pow(SIGMA, 2.0)));
}

float per(float min, float max, float t) {
    return (sin(t)+1.)/2.*(max-min)+min;
}