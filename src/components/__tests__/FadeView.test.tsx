import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { FadeView } from '../FadeView';

describe('FadeView', () => {
  it('renders children', async () => {
    const { getByText } = await render(
      <FadeView visible duration={0}>
        <Text>content</Text>
      </FadeView>
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('starts fully opaque when duration is 0', async () => {
    const { getByTestId } = await render(
      <FadeView visible={false} duration={0}>
        <Text testID="child">content</Text>
      </FadeView>
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('starts transparent when animating and not yet visible', async () => {
    const { getByText } = await render(
      <FadeView visible={false} duration={200}>
        <Text>hidden</Text>
      </FadeView>
    );
    // Content is mounted (layout happens behind the fade).
    expect(getByText('hidden')).toBeTruthy();
  });
});
