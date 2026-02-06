import * as THREE from 'three';
import { BASE_ZONES, ZoneManager } from '../config/constants.js';

export class Decorations {
  constructor(scene) {
    this.scene = scene;
  }

  build() {
    for (let i = 0; i < BASE_ZONES.length; i++) {
      this.decorateZone(i);
    }
  }

  decorateZone(zoneIndex) {
    const zone = ZoneManager.getZone(zoneIndex);
    const count = this._getDecoCount(zoneIndex);
    const builders = [
      () => this._sanctuary(),
      () => this._grasslands(),
      () => this._darkWoods(),
      () => this._scorchedFlats(),
      () => this._crimsonWastes(),
      () => this._frozenAbyss(),
      () => this._voidLands(),
      () => this._mythicCore(),
    ];

    const builder = zoneIndex < builders.length
      ? builders[zoneIndex]
      : () => this._proceduralCreature(zoneIndex);

    for (let i = 0; i < count; i++) {
      const pos = this._randomInRing(zone.innerRadius + 1, zone.outerRadius - 1);
      const deco = builder();
      if (deco) {
        deco.position.set(pos.x, 0, pos.z);
        deco.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(deco);
      }
    }
  }

  _getDecoCount(z) {
    const baseCounts = [20, 40, 60, 35, 30, 25, 20, 12];
    if (z < baseCounts.length) return baseCounts[z];
    return 10 + Math.floor(z * 1.5);
  }

  _randomInRing(inner, outer) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random() * (outer * outer - inner * inner) + inner * inner);
    return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
  }

  // Zone 0: Sanctuary - Butterflies and Frogs
  _sanctuary() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Butterfly: sphere body + 2 plane wings
      const bodyMat = new THREE.MeshLambertMaterial({ color: [0xff6688, 0xffaa44, 0xff44aa, 0xffff66][Math.floor(Math.random() * 4)] });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), bodyMat);
      body.position.y = 0.8 + Math.random() * 0.5;
      group.add(body);
      const wingGeo = new THREE.PlaneGeometry(0.2, 0.15);
      const wingMat = new THREE.MeshLambertMaterial({ color: bodyMat.color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.12, body.position.y, 0);
      wingL.rotation.y = 0.4;
      group.add(wingL);
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.12, body.position.y, 0);
      wingR.rotation.y = -0.4;
      group.add(wingR);
    } else {
      // Frog: squashed sphere + 2 cone legs
      const frogMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), frogMat);
      body.scale.y = 0.6;
      body.position.y = 0.1;
      group.add(body);
      const legGeo = new THREE.ConeGeometry(0.05, 0.12, 4);
      const legL = new THREE.Mesh(legGeo, frogMat);
      legL.position.set(-0.12, 0.03, 0.08);
      legL.rotation.z = 0.5;
      group.add(legL);
      const legR = new THREE.Mesh(legGeo, frogMat);
      legR.position.set(0.12, 0.03, 0.08);
      legR.rotation.z = -0.5;
      group.add(legR);
      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const eyeGeo = new THREE.SphereGeometry(0.03, 4, 4);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.06, 0.16, -0.1);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.06, 0.16, -0.1);
      group.add(eyeR);
    }
    return group;
  }

  // Zone 1: Grasslands - Slugs and Beetles
  _grasslands() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Slug: elongated sphere + eye stalks
      const slugMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), slugMat);
      body.scale.set(1, 0.5, 2);
      body.position.y = 0.06;
      group.add(body);
      const stalkGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
      const stalkMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
      const stalkL = new THREE.Mesh(stalkGeo, stalkMat);
      stalkL.position.set(-0.04, 0.12, -0.15);
      group.add(stalkL);
      const stalkR = new THREE.Mesh(stalkGeo, stalkMat);
      stalkR.position.set(0.04, 0.12, -0.15);
      group.add(stalkR);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const eyeGeo = new THREE.SphereGeometry(0.02, 4, 4);
      group.add(new THREE.Mesh(eyeGeo, eyeMat).translateX(-0.04).translateY(0.17).translateZ(-0.15));
      group.add(new THREE.Mesh(eyeGeo, eyeMat).translateX(0.04).translateY(0.17).translateZ(-0.15));
    } else {
      // Beetle: box body + sphere head + 6 legs
      const beetleMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.2), beetleMat);
      body.position.y = 0.08;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), beetleMat);
      head.position.set(0, 0.08, -0.14);
      group.add(head);
      const legGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 3);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
      for (let i = 0; i < 3; i++) {
        const zOff = -0.06 + i * 0.06;
        const ll = new THREE.Mesh(legGeo, legMat);
        ll.position.set(-0.1, 0.04, zOff);
        ll.rotation.z = 0.5;
        group.add(ll);
        const lr = new THREE.Mesh(legGeo, legMat);
        lr.position.set(0.1, 0.04, zOff);
        lr.rotation.z = -0.5;
        group.add(lr);
      }
    }
    return group;
  }

  // Zone 2: Dark Woods - Spiders and Bats
  _darkWoods() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Spider: sphere + 8 legs
      const spiderMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), spiderMat);
      body.position.y = 0.15;
      group.add(body);
      const legGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 3);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 4;
        const ll = new THREE.Mesh(legGeo, legMat);
        ll.position.set(-0.08, 0.1, Math.sin(angle) * 0.08);
        ll.rotation.z = 0.8;
        ll.rotation.y = angle;
        group.add(ll);
        const lr = new THREE.Mesh(legGeo, legMat);
        lr.position.set(0.08, 0.1, Math.sin(angle) * 0.08);
        lr.rotation.z = -0.8;
        lr.rotation.y = -angle;
        group.add(lr);
      }
      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const eyeGeo = new THREE.SphereGeometry(0.02, 4, 4);
      group.add(new THREE.Mesh(eyeGeo, eyeMat).translateX(-0.04).translateY(0.18).translateZ(-0.07));
      group.add(new THREE.Mesh(eyeGeo, eyeMat).translateX(0.04).translateY(0.18).translateZ(-0.07));
    } else {
      // Bat: sphere + 2 plane wings
      const batMat = new THREE.MeshLambertMaterial({ color: 0x3a2a3a });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), batMat);
      body.position.y = 1.5 + Math.random() * 0.5;
      group.add(body);
      const wingGeo = new THREE.PlaneGeometry(0.3, 0.15);
      const wingMat = new THREE.MeshLambertMaterial({ color: 0x2a1a2a, side: THREE.DoubleSide });
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.18, body.position.y, 0);
      wingL.rotation.y = 0.3;
      group.add(wingL);
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.18, body.position.y, 0);
      wingR.rotation.y = -0.3;
      group.add(wingR);
    }
    return group;
  }

  // Zone 3: Scorched Flats - Fire Imps and Lava Worms
  _scorchedFlats() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Fire Imp: cone body + sphere head + horns
      const impMat = new THREE.MeshLambertMaterial({ color: 0xcc4400, emissive: 0x441100, emissiveIntensity: 0.3 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 6), impMat);
      body.position.y = 0.12;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), impMat);
      head.position.y = 0.3;
      group.add(head);
      const hornGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
      const hornMat = new THREE.MeshLambertMaterial({ color: 0x660000 });
      const hornL = new THREE.Mesh(hornGeo, hornMat);
      hornL.position.set(-0.05, 0.38, 0);
      hornL.rotation.z = 0.3;
      group.add(hornL);
      const hornR = new THREE.Mesh(hornGeo, hornMat);
      hornR.position.set(0.05, 0.38, 0);
      hornR.rotation.z = -0.3;
      group.add(hornR);
    } else {
      // Lava Worm: 3 spheres descending into ground
      const wormMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0x331100, emissiveIntensity: 0.4 });
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.08 - i * 0.015, 6, 4), wormMat);
        seg.position.set(0, 0.2 - i * 0.08, i * 0.06);
        group.add(seg);
      }
    }
    return group;
  }

  // Zone 4: Crimson Wastes - Scorpions and Crabs
  _crimsonWastes() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Scorpion: box body + tail spheres + stinger cone
      const scMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.2), scMat);
      body.position.y = 0.06;
      group.add(body);
      // Tail: 3 spheres arcing upward
      const tailMat = new THREE.MeshLambertMaterial({ color: 0x7a3b10 });
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), tailMat);
        seg.position.set(0, 0.08 + i * 0.06, 0.12 + i * 0.04);
        group.add(seg);
      }
      // Stinger
      const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
      stinger.position.set(0, 0.26, 0.24);
      stinger.rotation.x = Math.PI;
      group.add(stinger);
    } else {
      // Crab: flat sphere + claws + legs
      const crabMat = new THREE.MeshLambertMaterial({ color: 0xcc4444 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), crabMat);
      body.scale.y = 0.4;
      body.position.y = 0.06;
      group.add(body);
      // Claws
      const clawGeo = new THREE.SphereGeometry(0.04, 4, 4);
      const clawL = new THREE.Mesh(clawGeo, crabMat);
      clawL.position.set(-0.18, 0.06, -0.06);
      group.add(clawL);
      const clawR = new THREE.Mesh(clawGeo, crabMat);
      clawR.position.set(0.18, 0.06, -0.06);
      group.add(clawR);
      // Legs
      const legGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 3);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x993333 });
      for (let i = 0; i < 3; i++) {
        const zOff = -0.04 + i * 0.04;
        const ll = new THREE.Mesh(legGeo, legMat);
        ll.position.set(-0.12, 0.03, zOff);
        ll.rotation.z = 0.6;
        group.add(ll);
        const lr = new THREE.Mesh(legGeo, legMat);
        lr.position.set(0.12, 0.03, zOff);
        lr.rotation.z = -0.6;
        group.add(lr);
      }
    }
    return group;
  }

  // Zone 5: Frozen Abyss - Ice Sprites and Snow Worms
  _frozenAbyss() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Ice Sprite: tetrahedron + aura sphere
      const spriteMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.8, shininess: 100 });
      const core = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12, 0), spriteMat);
      core.position.y = 0.6 + Math.random() * 0.3;
      group.add(core);
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.15 })
      );
      aura.position.copy(core.position);
      group.add(aura);
    } else {
      // Snow Worm: 4 icosahedron segments
      const wormMat = new THREE.MeshPhongMaterial({ color: 0xccddff, shininess: 60 });
      for (let i = 0; i < 4; i++) {
        const seg = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08 - i * 0.01, 0), wormMat);
        seg.position.set(Math.sin(i * 0.5) * 0.06, 0.1 + i * 0.04, i * 0.08);
        group.add(seg);
      }
    }
    return group;
  }

  // Zone 6: Void Lands - Jellyfish and Eye Horrors
  _voidLands() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Jellyfish: hemisphere + 4 tentacles
      const jellyMat = new THREE.MeshPhongMaterial({ color: 0x9944ff, transparent: true, opacity: 0.6 });
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        jellyMat
      );
      dome.position.y = 1.0 + Math.random() * 0.5;
      group.add(dome);
      const tentGeo = new THREE.CylinderGeometry(0.01, 0.005, 0.3, 4);
      const tentMat = new THREE.MeshLambertMaterial({ color: 0x7722cc, transparent: true, opacity: 0.5 });
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const tent = new THREE.Mesh(tentGeo, tentMat);
        tent.position.set(Math.cos(angle) * 0.08, dome.position.y - 0.2, Math.sin(angle) * 0.08);
        group.add(tent);
      }
    } else {
      // Eye Horror: sphere + pupil
      const eyeMat = new THREE.MeshPhongMaterial({ color: 0xeeeecc });
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
      eye.position.y = 0.6 + Math.random() * 0.4;
      group.add(eye);
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x220044 })
      );
      pupil.position.set(0, eye.position.y, -0.12);
      group.add(pupil);
    }
    return group;
  }

  // Zone 7: Mythic Core - Crystal Golems and Shadow Wraiths
  _mythicCore() {
    const group = new THREE.Group();
    if (Math.random() < 0.5) {
      // Crystal Golem: dodecahedron + box limbs
      const golemMat = new THREE.MeshPhongMaterial({ color: 0x6600cc, emissive: 0x220044, emissiveIntensity: 0.5, shininess: 80 });
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), golemMat);
      core.position.y = 0.5;
      group.add(core);
      const limbGeo = new THREE.BoxGeometry(0.06, 0.2, 0.06);
      const limbMat = new THREE.MeshLambertMaterial({ color: 0x440088 });
      // Arms
      const armL = new THREE.Mesh(limbGeo, limbMat);
      armL.position.set(-0.25, 0.4, 0);
      group.add(armL);
      const armR = new THREE.Mesh(limbGeo, limbMat);
      armR.position.set(0.25, 0.4, 0);
      group.add(armR);
      // Legs
      const legL = new THREE.Mesh(limbGeo, limbMat);
      legL.position.set(-0.1, 0.15, 0);
      group.add(legL);
      const legR = new THREE.Mesh(limbGeo, limbMat);
      legR.position.set(0.1, 0.15, 0);
      group.add(legR);
    } else {
      // Shadow Wraith: cone + torus halo
      const wraithMat = new THREE.MeshLambertMaterial({ color: 0x110022, emissive: 0x220044, emissiveIntensity: 0.4, transparent: true, opacity: 0.7 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 6), wraithMat);
      body.position.y = 0.4;
      group.add(body);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.02, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x6600cc })
      );
      halo.position.y = 0.7;
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
    }
    return group;
  }

  // Procedural creature for zones 8+
  _proceduralCreature(zoneIndex) {
    const group = new THREE.Group();
    const seed = zoneIndex * 7;
    const hue = (seed * 47) % 360;
    const r = Math.round((hue / 360) * 255);
    const g = Math.round(((hue + 120) % 360 / 360) * 128);
    const b = Math.round(((hue + 240) % 360 / 360) * 255);
    const color = (r << 16) | (g << 8) | b;
    const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.2 });

    const type = seed % 4;
    if (type === 0) {
      // Multi-sphere blob
      const count = 2 + (seed % 3);
      for (let i = 0; i < count; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.08 + i * 0.02, 6, 4), mat);
        s.position.set(Math.sin(i) * 0.06, 0.1 + i * 0.06, Math.cos(i) * 0.06);
        group.add(s);
      }
    } else if (type === 1) {
      // Spiked icosahedron
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat);
      core.position.y = 0.3;
      group.add(core);
      const spikeMat = new THREE.MeshLambertMaterial({ color });
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.15, 4), spikeMat);
        spike.position.set(Math.cos(i * 1.57) * 0.12, 0.3, Math.sin(i * 1.57) * 0.12);
        spike.lookAt(core.position);
        group.add(spike);
      }
    } else if (type === 2) {
      // Floating torus creature
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 6, 12), mat);
      torus.position.y = 0.5 + Math.random() * 0.5;
      torus.rotation.x = Math.PI / 3;
      group.add(torus);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      eye.position.set(0, torus.position.y, 0);
      group.add(eye);
    } else {
      // Crystal cluster
      for (let i = 0; i < 3; i++) {
        const h = 0.2 + Math.random() * 0.3;
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 5), mat);
        crystal.position.set((Math.random() - 0.5) * 0.15, h / 2, (Math.random() - 0.5) * 0.15);
        crystal.rotation.z = (Math.random() - 0.5) * 0.4;
        group.add(crystal);
      }
    }
    return group;
  }
}
