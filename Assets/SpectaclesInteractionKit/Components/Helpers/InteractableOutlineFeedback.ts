import { Interactable } from '../Interaction/Interactable/Interactable';

@component
export class InteractableOutlineFeedback extends BaseScriptComponent {
  @input
  @hint('This is the material that will provide the mesh outline')
      targetOutlineMaterial: Material;

  @input('vec4', '{1, 1, 0.04, 1}')
  @hint('This is the colour of the outline when hovered')
  @widget(new ColorWidget())
      hoveringColor: vec4 = new vec4(1, 1, 0.04, 1);

  @input('vec4', '{1, 1, 1, 1}')
  @hint('This is the colour of the outline when pinched')
  @widget(new ColorWidget())
      activatingColor: vec4 = new vec4(1, 1, 1, 1);

  @input
  @hint('This is the thickness of the outline')
      outlineWeight: number = 0.25;

  @input
  @hint('These are the meshes that will be outlined on pinch/hover')
      meshVisuals: RenderMeshVisual[];

  @input
  @hint('Text object to display pinch status')
      textObject: SceneObject;

  @input
  @hint('Sphere object to be shown at step 4')
      sphereObject: SceneObject;
  
  @input
  @hint('box object to be shown for end')
      savedoneObject: SceneObject;

  private interactable: Interactable;
  private outlineEnabled: boolean = true;
  private highlightMaterial: Material;
  private pinchCount: number = 0;
  private resetEvent; // タイマーイベントを保持するための変数

  onAwake() {
      this.defineScriptEvents();
  }
  addMaterialToRenderMeshArray() {
      if (!this.outlineEnabled) {
          return;
      }
      for (let i = 0; i < this.meshVisuals.length; i++) {
          const matCount = this.meshVisuals[i].getMaterialsCount();

          let addMaterial = true;
          for (let k = 0; k < matCount; k++) {
              const material = this.meshVisuals[i].getMaterial(k);

              if (material.isSame(this.highlightMaterial)) {
                  addMaterial = false;
                  break;
              }
          }

          if (addMaterial) {
              const materials = this.meshVisuals[i].materials;
              materials.unshift(this.highlightMaterial);
              this.meshVisuals[i].materials = materials;
          }
      }
  }

  removeMaterialFromRenderMeshArray() {
      for (let i = 0; i < this.meshVisuals.length; i++) {
          const materials = [];

          const matCount = this.meshVisuals[i].getMaterialsCount();

          for (let k = 0; k < matCount; k++) {
              const material = this.meshVisuals[i].getMaterial(k);

              if (material.isSame(this.highlightMaterial)) {
                  continue;
              }

              materials.push(material);
          }

          this.meshVisuals[i].clearMaterials();

          for (let k = 0; k < materials.length; k++) {
              this.meshVisuals[i].addMaterial(materials[k]);
          }
      }
  }

  private defineScriptEvents() {
      this.createEvent('OnStartEvent').bind(() => {
          this.init();

          this.createEvent('OnEnableEvent').bind(() => {
              this.outlineEnabled = true;
          });

          this.createEvent('OnDisableEvent').bind(() => {
              this.outlineEnabled = false;
              this.removeMaterialFromRenderMeshArray();
          });
      });
  }

  init() {
      this.highlightMaterial = this.targetOutlineMaterial.clone();
      this.highlightMaterial.mainPass.lineWeight = this.outlineWeight;

      if (!this.targetOutlineMaterial) {
          throw new Error('Please ensure Material is added in the inspector.');
      }
      this.highlightMaterial = this.targetOutlineMaterial.clone();
      this.highlightMaterial.mainPass.lineWeight = this.outlineWeight;
      this.highlightMaterial.mainPass.lineColor = this.hoveringColor;

      this.interactable = this.getSceneObject().getComponent(Interactable.getTypeName());
      if (!this.interactable) {
          throw new Error('No interactable was found - please ensure that a component matching the Interactable typename provided was added to this SceneObject.');
      }

      this.setupInteractableCallbacks();
      this.updateText("Start CPR guide");  // 初期テキストの設定

      // スフィアを初期状態で非表示に設定
      if (this.sphereObject) {
          this.sphereObject.enabled = false;
      }
  }

  setupInteractableCallbacks() {
      this.interactable.onHoverEnter.add(() => {
          this.addMaterialToRenderMeshArray();
      });

      this.interactable.onHoverExit.add(() => {
          this.removeMaterialFromRenderMeshArray();
      });

      this.interactable.onTriggerStart.add(() => {
          this.highlightMaterial.mainPass.lineColor = this.activatingColor;
          this.updatePinchText();  // ピンチによるテキストとタスクの更新
      });

      this.interactable.onTriggerEnd.add(() => {
          this.highlightMaterial.mainPass.lineColor = this.hoveringColor;
      });

      this.interactable.onTriggerCanceled.add(() => {
          this.highlightMaterial.mainPass.lineColor = this.hoveringColor;
          this.removeMaterialFromRenderMeshArray();
      });
  }

  updatePinchText() {
      // タイマーイベントが既に存在する場合はキャンセル
      if (this.resetEvent) {
          this.resetEvent.enabled = false;
      }

      switch (this.pinchCount) {
          case 0:
              this.updateText("Start CPR guide");
              this.pinchCount++;
              break;
          case 1:
              this.updateText("Check surroundings for safety");
              if (this.savedoneObject) {
                  this.savedoneObject.enabled = true; // スフィアを表示
              }
              this.pinchCount++;
              break;
          case 2:
              this.updateText("Check consciousness:\nTap shoulder & call loudly");
              this.pinchCount++;
              break;
          case 3:
              this.updateText("Ask the nearest person to call 911");
              this.pinchCount++;
              break;
          case 4:
              this.updateText("Check breathing:\nWatch chest movement (10 sec)");
              this.resetEvent = this.createDelayedEvent(15.0, () => {
                  this.updatePinchText(); // 15秒後に次のステップへ
              });
              this.pinchCount++;
              break;
          case 5:
              this.updateText("Position hands at center of chest");
              if (this.sphereObject) {
                  this.sphereObject.enabled = true; // スフィアを表示
              }
              this.resetEvent = this.createDelayedEvent(5.0, () => {
                  this.updatePinchText(); // 5秒後に次のステップへ
              });
              this.pinchCount++;
              break;
          case 6:
              this.updateText("Keep pushing 2 inches in time\n with the rhythm of the sphere.");
              this.resetEvent = this.createDelayedEvent(15.0, () => {
                  this.updatePinchText(); // 15秒後に次のステップへ
              });
              this.pinchCount++;
              break;
          case 7:
              this.updateText("Stop for a moment and\n check breathing and consciousness.");
              if (this.sphereObject) {
                  this.sphereObject.enabled = false; // スフィアを非表示
              }
              this.resetEvent = this.createDelayedEvent(15.0, () => {
                  this.updatePinchText(); // 15秒後に次のステップへ
              });
              this.pinchCount = 5; // 5番に戻る
              break;
      }
  }

  createDelayedEvent(delayTime, callback) {
      const event = this.createEvent("DelayedCallbackEvent");
      event.bind(callback);
      event.reset(delayTime);
      return event;
  }

  updateText(newText: string) {
      if (this.textObject && this.textObject.getComponent("Component.Text")) {
          this.textObject.getComponent("Component.Text").text = newText;
      }
  }
}
