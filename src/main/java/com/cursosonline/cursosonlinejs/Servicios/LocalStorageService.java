package com.cursosonline.cursosonlinejs.Servicios;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;

@Service
public class LocalStorageService {

    // Carpeta base donde se guardan los archivos (configurable en application.properties)
    @Value("${app.uploads-dir:uploads}")
    private String uploadsDir;

    /** Guarda un MultipartFile en {uploadsDir}/{subfolder}/ y devuelve la URL pública /uploads/... */
    public String save(MultipartFile file, String subfolder, String fileNameSafe) throws IOException {
        if (file == null || file.isEmpty()) throw new IOException("Archivo vacío");

        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElseGet(() -> detectExt(file.getContentType()));
        if (ext == null || ext.isBlank()) ext = ".bin";

        String clean = sanitize(fileNameSafe);
        Path base = Paths.get(uploadsDir, subfolder).toAbsolutePath().normalize();
        Files.createDirectories(base);

        String finalName = clean + "-" + System.currentTimeMillis() + ext.toLowerCase();
        Path dest = base.resolve(finalName);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/uploads/" + subfolder.replace("\\","/") + "/" + finalName;
    }

    /** Guarda bytes crudos con contentType en {uploadsDir}/{subfolder}/ y devuelve la URL pública /uploads/... */
    public String saveBytes(byte[] bytes, String contentType, String subfolder, String fileNameSafe) throws IOException {
        if (bytes == null || bytes.length == 0) throw new IOException("Archivo vacío");

        String ext = detectExt(contentType);
        if (ext == null || ext.isBlank()) ext = ".bin";

        String clean = sanitize(fileNameSafe);
        Path base = Paths.get(uploadsDir, subfolder).toAbsolutePath().normalize();
        Files.createDirectories(base);

        String finalName = clean + "-" + System.currentTimeMillis() + ext.toLowerCase();
        Path dest = base.resolve(finalName);

        Files.write(dest, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

        return "/uploads/" + subfolder.replace("\\","/") + "/" + finalName;
    }

    /* ---------------- helpers ---------------- */

    private static String sanitize(String s) {
        if (s == null || s.isBlank()) return "file";
        return s.replaceAll("[^a-zA-Z0-9_-]", "");
    }

    private static String detectExt(String contentType) {
        if (contentType == null) return null;
        switch (contentType.toLowerCase()) {
            case "image/png":  return ".png";
            case "image/jpeg": return ".jpg";
            case "image/webp": return ".webp";
            case "image/gif":  return ".gif";
            default: return null;
        }
    }
}
