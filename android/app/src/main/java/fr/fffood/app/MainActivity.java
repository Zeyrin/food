package fr.fffood.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Une recette partagée vers FFFood depuis une autre app (intent SEND,
     * voir AndroidManifest.xml). On ouvre `/partage/` avec le texte reçu,
     * exactement comme le fait le navigateur pour la PWA : c'est l'app web
     * qui y trouve l'adresse et lance l'import (src/lib/partageRecu.ts).
     *
     * BridgeActivity appelle déjà onNewIntent depuis onCreate : le même
     * chemin sert au démarrage à froid et à l'app déjà ouverte.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction()) || getBridge() == null) return;

        String texte = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (texte == null) return;
        String sujet = intent.getStringExtra(Intent.EXTRA_SUBJECT);

        Uri.Builder adresse = Uri.parse(getBridge().getLocalUrl()).buildUpon().path("/partage/").appendQueryParameter("text", texte);
        if (sujet != null) adresse.appendQueryParameter("title", sujet);
        String url = adresse.build().toString();
        // Après le chargement que le bridge vient de lancer, pas pendant.
        getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(url));
        // Consommé : une rotation ou un retour dans l'app ne doit pas
        // relancer l'import.
        setIntent(new Intent(Intent.ACTION_MAIN));
    }
}
