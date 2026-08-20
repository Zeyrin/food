import { useState } from 'react'
import Icone from '../components/Icone'
import { ONBOARDING_SLIDES } from '../data/onboarding'

interface Props {
  onTerminer: () => void
}

/**
 * Présentation des fonctionnalités, une diapo par fonctionnalité
 * (contenu dans data/onboarding.ts). Affichée au premier lancement,
 * et réaccessible depuis Réglages.
 */
export default function Onboarding({ onTerminer }: Props) {
  const [index, setIndex] = useState(0)
  const diapo = ONBOARDING_SLIDES[index]!
  const dernier = index === ONBOARDING_SLIDES.length - 1

  const suivant = () => (dernier ? onTerminer() : setIndex((i) => i + 1))

  return (
    <div className="onboarding">
      <button className="discret onboarding-passer" onClick={onTerminer}>
        Passer
      </button>

      <div className="onboarding-corps">
        <div className="onboarding-icone" aria-hidden="true">
          <Icone nom={diapo.icone} taille={40} />
        </div>
        <h1>{diapo.titre}</h1>
        <p className="aide">{diapo.texte}</p>
      </div>

      <div className="onboarding-points" role="tablist" aria-label="Étapes de la présentation">
        {ONBOARDING_SLIDES.map((s, i) => (
          <button
            key={s.titre}
            className="onboarding-point"
            role="tab"
            aria-current={i === index}
            aria-selected={i === index}
            aria-label={`Étape ${i + 1} sur ${ONBOARDING_SLIDES.length} : ${s.titre}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <button className="principal" onClick={suivant}>
        {dernier ? 'Commencer' : 'Suivant'}
      </button>
    </div>
  )
}
