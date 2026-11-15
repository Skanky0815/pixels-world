/** One tab may restart only after its own explicit confirmation. */
export class UpdateConsent {
  private confirmed = false;
  private controlledByUpdate = false;
  private reloading = false;
  private readonly reload: () => void;

  constructor(reload: () => void) {
    this.reload = reload;
  }

  controllerChanged() {
    this.controlledByUpdate = true;
    this.reloadIfConfirmed();
  }

  // eslint-disable-next-line max-lines-per-function -- Freigabe und Fehler-Rücknahme gehören zur selben Aktivierungsgrenze.
  async confirm(activate: () => Promise<void>) {
    if (this.confirmed) return;
    this.confirmed = true;

    try {
      if (this.controlledByUpdate) this.reloadIfConfirmed();
      else await activate();
    } catch (error) {
      this.confirmed = false;
      throw error;
    }
  }

  private reloadIfConfirmed() {
    if (!this.confirmed || this.reloading) return;
    this.reloading = true;
    this.reload();
  }
}
