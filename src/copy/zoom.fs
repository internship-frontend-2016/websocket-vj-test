precision mediump float;

uniform sampler2D texture;
uniform float     strength;
varying vec2      vTexCoord;

//追加した
uniform float width;
uniform float height;

//const float tFrag = 1.0 / 512.0;
float tFrag = 1.0 / width;
const float nFrag = 1.0 / 30.0;
//const vec2  centerOffset = vec2(256.0, 256.0);
vec2  centerOffset = vec2(width, height);

float rnd(vec3 scale, float seed){
	return fract(sin(dot(gl_FragCoord.stp + seed, scale)) * 43758.5453 + seed);
}

void main(void){
	vec3  destColor = vec3(0.0);
	float random = rnd(vec3(12.9898, 78.233, 151.7182), 0.0);
	vec2  fc = vec2(gl_FragCoord.s, height - gl_FragCoord.t);
	vec2  fcc = fc - centerOffset;
	float totalWeight = 0.0;
	
	for(float i = 0.0; i <= 30.0; i++){
		float percent = (i + random) * nFrag;
		float weight = percent - percent * percent;
		vec2  t = fc - fcc * percent * strength * nFrag;
		destColor += texture2D(texture, t * tFrag).rgb * weight;
		totalWeight += weight;
	}
	gl_FragColor = vec4(destColor / totalWeight, 1.0);
}