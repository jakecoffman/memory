<script>
  import {fly} from 'svelte/transition'
  import {createEventDispatcher, onDestroy} from 'svelte';

  const dispatch = createEventDispatcher();
  const close = () => dispatch('close');

  let modal;
</script>

<div class="modal-background" on:click={close}></div>

<div transition:fly="{{ y: -200, duration: 500 }}" class="modal" role="dialog" aria-modal="true" bind:this={modal}>
  <slot name="header"></slot>
  <slot></slot>
  <div class="actions">
    <button on:click={close}>ok</button>
  </div>
</div>

<style>
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }

  .modal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(100vw - 4em);
    max-width: 32em;
    max-height: calc(100vh - 4em);
    overflow: auto;
    transform: translate(-50%, -50%);
    padding: .25rem 1rem;
    border-radius: 0.2em;
    background: white;
  }

  button {
    display: block;
    font-size: 2em;
    padding: .25em .5em;
  }

  .actions {
    display: flex;
    justify-content: end;
  }
</style>
