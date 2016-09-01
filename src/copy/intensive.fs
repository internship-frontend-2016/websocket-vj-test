precision mediump float;
uniform float time; // time
uniform vec2 mouse;
uniform vec2 iResolution;
uniform vec4 hsv;

const float PI = 3.1415926;
const vec3 lightColor = vec3(0.95, 0.95, 0.5);  // 背景の後光の色
const vec3 backColor = vec3(0.95, 0.25, 0.25);  // 背景の下地の色

// 背景の後光を描く
void sunrise(vec2 p, inout vec3 i){
    float f = atan(p.y, p.x) + time;
    float fs = sin(f * 10.0);
    i = mix(lightColor, backColor, fs);
}

void main(){
    // 座標を正規化する
    vec2 p = (gl_FragCoord.xy * 2.0 - iResolution) / min(iResolution.x, iResolution.y);

    // 最終的に出力される色
    vec3 destColor = vec3(1.0);

    // 背景の後光を描く
    sunrise(p, destColor);

    gl_FragColor = vec4(destColor, 1.0);
}