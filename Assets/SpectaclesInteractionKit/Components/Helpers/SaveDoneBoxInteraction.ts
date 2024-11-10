import { Interactable } from '../Interaction/Interactable/Interactable';

@component
export class SaveDoneBoxInteraction extends BaseScriptComponent {
  @input
  @hint('SaveDoneBox that will be interacted with')
      saveDoneBox: SceneObject;
  
  @input
  @hint('Text object to enable when pinched')
      saveText: SceneObject;
  
  @input
  @hint('Object to disable on pinch')
      canTouch: SceneObject;

  @input
  @hint('Object to disable on pinch heart')
      Heart: SceneObject;

  private interactable: Interactable;

  onAwake() {
      this.init();
  }

  init() {
      // Interactable コンポーネントを取得
      this.interactable = this.saveDoneBox.getComponent(Interactable.getTypeName());
      if (!this.interactable) {
          throw new Error('No interactable was found on SaveDoneBox - please ensure that an Interactable component is added to SaveDoneBox.');
      }

      // ピンチのコールバック設定
      this.setupInteractableCallbacks();
      
      // 初期状態で Save Text を非表示に設定
      if (this.saveText) {
          this.saveText.enabled = false;
      }
  }

  setupInteractableCallbacks() {
      this.interactable.onTriggerStart.add(() => {
          this.handlePinch();
      });
  }

  handlePinch() {
      // Save Text を表示
      if (this.saveText) {
          this.saveText.enabled = true;
      }

      // can_touch と SaveDoneBox を非表示
      if (this.canTouch) {
          this.canTouch.enabled = false;
      }
      if (this.saveDoneBox) {
          this.saveDoneBox.enabled = false;
      }
      if (this.Heart) {
          this.Heart.enabled = false;
      }
  }
}

