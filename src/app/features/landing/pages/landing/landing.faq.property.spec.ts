// Feature: schedify-landing-redesign, Property 2: FAQ accordion mutual exclusion
// Validates: Requirements 12.4
import * as fc from 'fast-check';
import { LandingComponent } from './landing.component';

describe('LandingComponent – FAQ accordion (Property 2: mutual exclusion)', () => {
  function makeComponent(): LandingComponent {
    // LandingComponent has no injected dependencies — safe to instantiate directly
    return new LandingComponent();
  }

  it('openFaq is always null or a single valid index after any sequence of toggles', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 20 }),
        (indices) => {
          const component = makeComponent();
          indices.forEach(i => component.toggleFaq(i));
          return (
            component.openFaq === null ||
            (Number.isInteger(component.openFaq) &&
             component.openFaq >= 0 &&
             component.openFaq < component.faqs.length)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
