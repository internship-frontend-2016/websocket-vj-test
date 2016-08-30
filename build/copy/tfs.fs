precision mediump float;
#define PI 3.14159265359
uniform float time;
uniform vec2 mouse;
//uniform vec2 resolution;
uniform vec2 iResolution;

void main( void )
{
    vec2 uv = gl_FragCoord.xy / iResolution.xy / .5 - 1.;
    uv.x *= iResolution.x / iResolution.y;
    // make a tube
    float f = 1. / length(uv);
    // add the angle
    f += atan(uv.x, uv.y) / acos(0.);
    // let's roll
    //f -= iGlobalTime;
    f -= time;
    // make it black and white
    // old version without AA: f = floor(fract(f) * 2.);
    // new version based on Shane's suggestion:
    f = 1. - clamp(sin(f * PI * 2.) * dot(uv, uv) * iResolution.y / 15. + .5, 0., 1.);
    // add the darkness to the end of the tunnel
    f *= sin(length(uv) - .1);
    gl_FragColor = vec4(0.8*f,0.5*f,0.0*f, 1.0);
}
