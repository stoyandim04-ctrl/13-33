import type { Lang } from "./store";

/** Headlines stay English (product voice). Lines are split on "\n". */
export const SCENE_COPY: { title: string; sub: Record<Lang, string> }[] = [
  {
    title: "Silence,\nEngineered.",
    sub: {
      bg: "Звук без граници.\nТишина без компромис.",
      en: "Sound without limits.\nSilence without compromise.",
    },
  },
  {
    title: "Hear the\nUnheard.",
    sub: {
      bg: "Всяка нота, сякаш\nродена в тишина.",
      en: "Every note, as if\nborn in silence.",
    },
  },
  {
    title: "Shaped\nby Night.",
    sub: {
      bg: "Форма, изваяна за ухото.\nМатериали от бъдещето.",
      en: "A form sculpted for the ear.\nMaterials from the future.",
    },
  },
  {
    title: "Touch.\nNothing More.",
    sub: {
      bg: "Хаптичен контрол, който\nусещаш, а не виждаш.",
      en: "Haptic control you\nfeel, not see.",
    },
  },
  {
    title: "The Nocturne\nCore.",
    sub: {
      bg: "40 часа звук.\nЯдро, което не спи.",
      en: "40 hours of sound.\nA core that never sleeps.",
    },
  },
];

export const UI_COPY = {
  menu: { bg: "Меню", en: "Menu" },
  close: { bg: "Затвори", en: "Close" },
  sound: { bg: "Звук", en: "Sound" },
  ask: { bg: "Попитай NOCTA", en: "Ask NOCTA" },
  scroll: { bg: "Скролни", en: "Scroll" },
  concept: {
    bg: "Концептуален проект на 13:33 Digital Studio. Марката и продуктът са измислени.",
    en: "A concept project by 13:33 Digital Studio. The brand and the product are fictional.",
  },
  loading: { bg: "Зареждане", en: "Loading" },
} satisfies Record<string, Record<Lang, string>>;

/** Menu links jump to a point of the scroll. */
export const MENU: { label: Record<Lang, string>; to: number }[] = [
  { label: { bg: "Звук", en: "Sound" }, to: 0.2 },
  { label: { bg: "Форма", en: "Form" }, to: 0.385 },
  { label: { bg: "Докосване", en: "Touch" }, to: 0.53 },
  { label: { bg: "Ядро", en: "Core" }, to: 0.705 },
];

export const ASK: { q: Record<Lang, string>; a: Record<Lang, string> }[] = [
  {
    q: { bg: "Колко издържа батерията?", en: "How long does the battery last?" },
    a: {
      bg: "До 10 часа в слушалките и 40 часа общо с кутийката. Десет минути зареждане дават два часа звук.",
      en: "Up to 10 hours in the buds and 40 hours in total with the case. Ten minutes of charging gives two hours of sound.",
    },
  },
  {
    q: { bg: "Колко силно е шумопотискането?", en: "How strong is the noise cancelling?" },
    a: {
      bg: "До −42 dB. Шест микрофона слушат света около теб и го гасят, преди да стигне до ухото.",
      en: "Up to −42 dB. Six microphones listen to the world around you and cancel it before it reaches your ear.",
    },
  },
  {
    q: { bg: "Мога ли да ги купя?", en: "Can I buy them?" },
    a: {
      bg: "Не. NOCTA One е концепция на 13:33 Digital Studio. Марката и продуктът са измислени, за да покажем какво можем да изградим.",
      en: "No. NOCTA One is a concept by 13:33 Digital Studio. The brand and product are fictional, made to show what we can build.",
    },
  },
];
