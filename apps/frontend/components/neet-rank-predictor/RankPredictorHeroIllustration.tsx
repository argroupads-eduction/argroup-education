import Image from 'next/image';

const HERO_IMAGE = '/images/rank-predictor-hero-doctor.png';

/** Premium hero visual for rank predictor popup — medical expert portrait. */
export function RankPredictorHeroIllustration() {
  return (
    <div className="rank-popup-hero-visual" aria-hidden>
      <div className="rank-popup-hero-visual__frame">
        <div className="rank-popup-hero-visual__glow" />
        <div className="rank-popup-hero-visual__image-wrap">
          <Image
            src={HERO_IMAGE}
            alt=""
            width={540}
            height={675}
            className="rank-popup-hero-visual__image"
            sizes="(max-width: 767px) 86vw, 268px"
            priority
          />
        </div>
        <div className="rank-popup-hero-visual__badge">NEET 2026</div>
      </div>
      <p className="rank-popup-hero-visual__caption">Predict rank · Map colleges · Plan MBBS</p>
    </div>
  );
}
