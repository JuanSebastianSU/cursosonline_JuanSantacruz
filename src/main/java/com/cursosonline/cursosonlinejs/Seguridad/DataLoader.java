package com.cursosonline.cursosonlinejs.Seguridad;

import com.cursosonline.cursosonlinejs.Entidades.Menu;
import com.cursosonline.cursosonlinejs.Repositorios.MenuRepositorio;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Inserta ítems de ejemplo si no hay ninguno en la BD. */
@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initMenu(MenuRepositorio repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(Menu.builder().nombre("Inicio").url("paginas/inicio.html").orden(1).build());
                repo.save(Menu.builder().nombre("Misión & Visión").url("paginas/mision-vision.html").orden(2).build());
                repo.save(Menu.builder().nombre("Contacto").url("paginas/contacto.html").orden(3).build());
            }
        };
    }
}
