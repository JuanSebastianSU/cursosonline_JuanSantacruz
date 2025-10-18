package com.cursosonline.cursosonlinejs.Entidades;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Ítem de menú que el frontend usa para construir la barra de navegación.
 * url apunta a un HTML local (p.ej. paginas/inicio.html).
 */
@Document(collection = "menu_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Menu {

    @Id
    private String id;

    @Indexed
    private String nombre;   // "Inicio", "Misión & Visión", "Contacto", etc.

    private String url;      // "paginas/inicio.html", "paginas/mision-vision.html", ...

    @Indexed
    private Integer orden;   // para ordenar en la barra (1,2,3...)
}
