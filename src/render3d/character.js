// Character model loader - now uses Ronaldo-based model from build_ronaldo_player.py
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class Character {
    constructor() {
        this.model = null;
        this.mixer = new THREE.AnimationMixer();
        this.actions = {};
        this.currentAction = null;
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);

        // Load the Ronaldo-based player model
        loader.load('/models/player.glb',
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(1, 1, 1);

                // Strip mixamorig: prefix from bone names for compatibility
                this.model.traverse((child) => {
                    if (child.isBone) {
                        child.name = child.name.replace(/^mixamorig:?/, '');
                    }
                });

                this.mixer = new THREE.AnimationMixer(this.model);

                // Load animations from the model
                gltf.animations.forEach((clip) => {
                    const action = this.mixer.clipAction(clip);
                    this.actions[clip.name] = action;
                });

                // Start with idle animation
                if (this.actions['idle']) {
                    this.playAction('idle', 0.5);
                }

                console.log('Character model loaded successfully:', {
                    vertexCount: this.getVertexCount(),
                    boneCount: this.getBoneCount(),
                    animationCount: Object.keys(this.actions).length
                });
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading character model:', error);
            }
        );
    }

    getVertexCount() {
        return this.model ? this.getTotalVertices(this.model) : 0;
    }

    getBoneCount() {
        return this.model ? this.countBones(this.model) : 0;
    }

    getTotalVertices(obj) {
        let count = 0;
        obj.traverse((child) => {
            if (child.isMesh && child.geometry) {
                count += child.geometry.attributes.position.count;
            }
        });
        return count;
    }

    countBones(obj) {
        let count = 0;
        obj.traverse((child) => {
            if (child.isBone) {
                count++;
            }
        });
        return count;
    }

    playAction(name, fadeTime = 0.3) {
        if (!this.model || !this.actions[name]) return;

        const newAction = this.actions[name];
        const currentAction = this.currentAction;

        if (currentAction && currentAction !== newAction) {
            currentAction.fadeOut(fadeTime);
        }

        newAction.reset();
        newAction.setEffectiveTimeScale(1.0);
        newAction.setEffectiveWeight(1.0);
        newAction.fadeIn(fadeTime);
        newAction.play();

        this.currentAction = newAction;
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    dispose() {
        if (this.model) {
            this.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        if (this.mixer) {
            this.mixer.unclear();
        }
    }
}

export default Character;