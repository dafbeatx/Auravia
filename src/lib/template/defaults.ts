import type { InvitationContentQuote } from './types';

/**
 * Fallback konten kutipan Islami untuk seksi Quote (QS. Ar-Rum: 21)
 * Dipisahkan dari komponen renderer agar presentasi dan data terisolasi rapi.
 */
export const DEFAULT_ISLAMIC_QUOTE: Required<InvitationContentQuote> = {
  enabled: true,
  arabic:
    'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ',
  translation:
    'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berpikir.',
  source: 'QS. Ar-Rum: 21',
};
