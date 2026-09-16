package com.citrafit.experimental;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Stores only the refresh token. The encryption key never leaves Android Keystore. */
@CapacitorPlugin(name = "SessionVault")
public class SessionVaultPlugin extends Plugin {
    private static final String ALIAS = "runlife.session.v1";
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("session_vault", Context.MODE_PRIVATE);
    }
    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true).build());
            generator.generateKey();
        }
        return (SecretKey) store.getKey(ALIAS, null);
    }
    @PluginMethod
    public void set(PluginCall call) {
        String value = call.getString("value");
        if (value == null || value.isEmpty() || value.length() > 16384) { call.reject("Sessão inválida."); return; }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            String data = Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
            String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
            if (!prefs().edit().putString("data", data).putString("iv", iv).commit()) throw new Exception();
            call.resolve();
        } catch (Exception error) { call.reject("Não foi possível proteger a sessão."); }
    }
    @PluginMethod
    public void get(PluginCall call) {
        JSObject result = new JSObject();
        String data = prefs().getString("data", null);
        if (data == null) { result.put("value", ""); call.resolve(result); return; }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            byte[] iv = Base64.decode(prefs().getString("iv", ""), Base64.NO_WRAP);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            result.put("value", new String(cipher.doFinal(Base64.decode(data, Base64.NO_WRAP)), StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (Exception error) {
            prefs().edit().clear().commit();
            result.put("value", ""); call.resolve(result);
        }
    }
    @PluginMethod
    public void clear(PluginCall call) {
        if (prefs().edit().clear().commit()) call.resolve();
        else call.reject("Não foi possível apagar a sessão local.");
    }
}
