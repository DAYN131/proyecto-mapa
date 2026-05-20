from configparser import ConfigParser

def load_config(filename='database.ini', section='postgresql'):
    # Crear parser
    parser = ConfigParser()
    # Leer archivo
    parser.read(filename)
    
    # Obtener seccion postgresql
    config = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            config[param[0]] = param[1]
    else:
        raise Exception(f'Sección {section} no encontrada en el archivo {filename}')
        
    return config



