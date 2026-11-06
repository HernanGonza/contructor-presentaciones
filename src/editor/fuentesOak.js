import l from "../fonts/OakSans-Light.ttf";
import r from "../fonts/OakSans-Regular.ttf";
import m from "../fonts/OakSans-Medium.ttf";
import s from "../fonts/OakSans-SemiBold.ttf";
import b from "../fonts/OakSans-Bold.ttf";

export const OAK = [[300, l], [400, r], [500, m], [600, s], [700, b]];

// Solo para el editor; al exportar se embebe en el HTML si la presentación la usa.
export const cssOak = OAK.map(([w, u]) => `@font-face{font-family:"Oak Sans";src:url(${u}) format("truetype");font-weight:${w};font-display:block}`).join("\n");
