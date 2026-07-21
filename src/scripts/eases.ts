// Curvas del sistema de motion (DESIGN.md §5). Son las ÚNICAS eases del
// proyecto — prohibido volver a power2.out/expo.out genéricos.
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// prensa — golpe seco y asentamiento lento: impactos, sellos, reimpresión.
CustomEase.create('prensa', '0.45,0.05,0.55,0.95');
// tinta — arranque casi lineal, frenada suave: reveals y movimientos que fluyen.
CustomEase.create('tinta', '0.33,0,0.2,1');
// salida — ease-in corto para lo que se va.
CustomEase.create('salida', '0.5,0,0.75,0.4');
