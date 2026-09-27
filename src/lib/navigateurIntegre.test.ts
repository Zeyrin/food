import { test } from 'node:test'
import assert from 'node:assert/strict'
import { navigateurIntegre } from './navigateurIntegre'

test('reconnaît les vues web des apps sociales', () => {
  assert.equal(
    navigateurIntegre(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.40.92',
    ),
    'Instagram',
  )
  assert.equal(
    navigateurIntegre(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0 Mobile Safari/537.36 trill_350003 BytedanceWebview/d8a21c6',
    ),
    'TikTok',
  )
  assert.equal(navigateurIntegre('Mozilla/5.0 (iPhone) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]'), 'Facebook')
})

test('laisse tranquilles les vrais navigateurs', () => {
  assert.equal(
    navigateurIntegre(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ),
    null,
  )
  assert.equal(
    navigateurIntegre('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'),
    null,
  )
})
