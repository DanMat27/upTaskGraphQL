const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

/* Modelos */
const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

/* Crea y firma un JWT */
const crearToken = (usuario, secret, expiresIn) => {
    const { id, email, nombre } = usuario;

    return jwt.sign( { id, email, nombre }, secret, { expiresIn } );
}

/* Resolvers de GraphQL */
const resolvers = {
    Query: {
        obtenerProyectos: async (root, {}, context) => {
            const proyectos = await Proyecto.find({ creador: context.id });

            return proyectos;
        },
        obtenerTareas: async (root, {input}, context) => {
            const tareas = await Tarea.find({ creador: context.id }).where('proyecto').equals(input.proyecto);

            return tareas;
        }
    },
    Mutation: {
        crearUsuario: async (root, {input}, context, info) => {
            const { email, password } = input;
            
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if(existeUsuario) {
                throw new Error('Un usuario ya esta registrado con ese email.');
            }

            try {
                /* Hash del password */
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);
                
                /* Crea el usuario */
                const nuevoUsuario = new Usuario(input);
                //console.log(nuevoUsuario);

                /* Almacena el usuario en la BD */
                nuevoUsuario.save();
                
                return 'Usuario creado correctamente';

            } catch (error) {   
                console.log(error);
            }
        },
        autenticarUsuario: async (root, {input}, context, info) => {
            const { email, password } = input;

            /* Si el usuario existe */
            const existeUsuario = await Usuario.findOne({ email });

            if(!existeUsuario) {
                throw new Error('No existe ningún usuario con ese email registrado.');
            }

            /* Si el password es correcto */
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);

            if(!passwordCorrecto) {
                throw new Error('Password incorrecta.');
            }

            /* Dar acceso a la App */
            return {
                token: crearToken(existeUsuario, process.env.SECRET, '12hr')
            }
        },
        nuevoProyecto: async (root, {input}, context, info) => {

            try {
                /* Crea un proyecto */
                const proyecto = new Proyecto(input);

                /* Asociamos el creador al proyecto */
                proyecto.creador = context.id;

                /* Almacena el proyecto en la BD */
                const resultado = await proyecto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }

        },
        actualizarProyecto: async (root, {id, input}, context, info) => {

            /* Revisar si existe el proyecto */
            let proyecto = await Proyecto.findById(id);

            if(!proyecto) {
                throw new Error('Proyecto no encontrado');
            }

            /* Revisar que si el usuario editor es el creador */
            if(proyecto.creador.toString() !== context.id) {
                throw new Error('No eres el creador de este proyecto');
            }

            /* Guardar el proyecto en la BD */
            proyecto = await Proyecto.findOneAndUpdate({ _id: id }, input, { new: true });

            return proyecto;
        },
        eliminarProyecto: async (root, {id, input}, context, info) => {

            /* Revisar si existe el proyecto */
            let proyecto = await Proyecto.findById(id);

            if(!proyecto) {
                throw new Error('Proyecto no encontrado');
            }

            /* Revisar que si el usuario editor es el creador */
            if(proyecto.creador.toString() !== context.id) {
                throw new Error('No eres el creador de este proyecto');
            }

            /* Guardar el proyecto en la BD */
            await Proyecto.findOneAndDelete({ _id: id });

            return "Proyecto eliminado";
        },
        nuevaTarea: async (root, {input}, context, info) => {

            try {
                /* Crea la tarea */
                const tarea = new Tarea(input);

                /* Asocia el creador a la tarea */
                tarea.creador = context.id;

                /* Almacena la tarea en la BD */
                const resultado = await tarea.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarTarea: async (root, {id, input, estado}, context, info) => {
            
            /* Revisar si existe la tarea */
            let tarea = await Tarea.findById(id);

            if(!tarea) {
                throw new Error('Tarea no encontrada');
            }

            /* Revisar que si el usuario editor es el creador */
            if(tarea.creador.toString() !== context.id) {
                throw new Error('No eres el creador de esta tarea');
            }

            /* Asignar nuevo estado */
            tarea.estado = estado;

            /* Guardar la tarea en la BD */
            tarea = await Tarea.findOneAndUpdate({ _id: id }, {...input, estado}, { new: true });

            return tarea;
        },
        eliminarTarea: async (root, {id}, context, info) => {

            /* Revisar si existe la tarea */
            let tarea = await Tarea.findById(id);

            if(!tarea) {
                throw new Error('Tarea no encontrada');
            }

            /* Revisar que si el usuario editor es el creador */
            if(tarea.creador.toString() !== context.id) {
                throw new Error('No eres el creador de esta tarea');
            }

            /* Guardar el proyecto en la BD */
            await Tarea.findOneAndDelete({ _id: id });

            return "Tarea eliminada";
        }
    },
}

module.exports = resolvers;