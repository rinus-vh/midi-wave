import {
  Checkbox,
  Dropdown,
  Knob,
  LabelSm, LabelUppercaseSm,
  ParagraphXs,
  RadioGroup,
  Slider,
} from '@6njp/prototype-library'

import styles from './ControlsOverview.module.css'

/** @param {{ layoutClassName?: string }} props */
export function ControlsOverview({ layoutClassName = undefined }) {
  const [knobA, setKnobA] = React.useState(42)
  const [knobB, setKnobB] = React.useState(75)
  const [knobC, setKnobC] = React.useState(10)
  const [sliderA, setSliderA] = React.useState(60)
  const [sliderB, setSliderB] = React.useState(30)
  const [checkA, setCheckA] = React.useState(true)
  const [checkB, setCheckB] = React.useState(false)
  const [checkC, setCheckC] = React.useState(true)
  const [radioVal, setRadioVal] = React.useState('b')
  const [dropVal, setDropVal] = React.useState(null)

  return (
    <div className={cx(styles.component, layoutClassName)}>
      <section className={styles.section}>
        <LabelUppercaseSm>Knob</LabelUppercaseSm>

        <div className={styles.sectionBody}>
          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Default</LabelSm>
            <div className={styles.knobRow}>
              <Knob
                value={knobA}
                onChange={setKnobA}
                min={0}
                max={100}
                step={1}
                label='Volume'
              />
              <Knob
                value={knobB}
                onChange={setKnobB}
                min={0}
                max={200}
                step={5}
                label='Frequency'
              />
              <Knob
                value={knobC}
                onChange={setKnobC}
                min={0}
                max={100}
                step={0.1}
                label='Pan'
              />
            </div>
          </div>

          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Fine (shift)</LabelSm>
            <ParagraphXs>
              Hold Shift while dragging for fine scrubbing. <br />
              Double-click to type a value.
            </ParagraphXs>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Slider</LabelUppercaseSm>

        <div className={styles.sectionBody}>
          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Horizontal</LabelSm>
            <div className={styles.sliderStack}>
              <Slider
                value={sliderA}
                onChange={setSliderA}
                min={0}
                max={100}
                step={1}
                label='Gain'
              />
              <Slider
                value={sliderB}
                onChange={setSliderB}
                min={-50}
                max={50}
                step={1}
                label='Offset'
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Checkbox</LabelUppercaseSm>

        <div className={styles.sectionBody}>
          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Default</LabelSm>
            <div className={styles.rowContent}>
              <Checkbox
                checked={checkA}
                onChange={setCheckA}
                label='Enable feature'
              />
              <Checkbox
                checked={checkB}
                onChange={setCheckB}
                label='Dark mode'
              />
              <Checkbox
                checked={checkC}
                onChange={setCheckC}
                label='Auto-save'
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Radio</LabelUppercaseSm>

        <div className={styles.sectionBody}>
          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Single select</LabelSm>
            <RadioGroup
              name='demo-radio'
              value={radioVal}
              onChange={setRadioVal}
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Dropdown</LabelUppercaseSm>

        <div className={styles.sectionBody}>
          <div className={styles.row}>
            <LabelSm layoutClassName={styles.rowLabelLayout}>Select</LabelSm>
            <Dropdown
              value={dropVal}
              onChange={setDropVal}
              placeholder='Choose a preset…'
              options={[
                { value: 'sine', label: 'Sine wave' },
                { value: 'square', label: 'Square wave' },
                { value: 'sawtooth', label: 'Sawtooth' },
                { value: 'triangle', label: 'Triangle' },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
