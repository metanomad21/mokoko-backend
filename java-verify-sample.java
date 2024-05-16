import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class VerifySignature {
    public static boolean verify(String data, String signatureStr, String publicKeyStr) throws Exception {
        // 假设 publicKeyStr 是 Base64 编码的公钥数据
        byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey publicKey = keyFactory.generatePublic(keySpec);

        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update(data.getBytes());

        byte[] signatureBytes = Base64.getDecoder().decode(signatureStr);
        return signature.verify(signatureBytes);
    }

    public static void main(String[] args) {
        try {
            String publicKeyStr = "你的公钥Base64编码字符串"; // 替换为你的Base64编码的公钥字符串
            String data = "This is the data to sign";
            String signatureStr = "your_signature_here";  // Replace with the actual signature

            boolean isVerified = verify(data, signatureStr, publicKeyStr);
            System.out.println("Signature verified: " + isVerified);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
