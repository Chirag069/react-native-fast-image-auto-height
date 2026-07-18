import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Placeholder } from '../Placeholder';

describe('Placeholder', () => {
  it('renders arbitrary React nodes', async () => {
    const { getByText } = await render(
      <Placeholder placeholder={<Text>skeleton</Text>} />
    );
    expect(getByText('skeleton')).toBeTruthy();
  });

  it('renders remote sources through the native engine', async () => {
    const { getByTestId } = await render(
      <Placeholder
        placeholder={{ uri: 'https://a.com/blur.jpg' }}
        testID="ph"
      />
    );
    const image = getByTestId('ph');
    expect(image.props.source).toEqual({ uri: 'https://a.com/blur.jpg' });
  });

  it('renders local assets through the native engine', async () => {
    const { getByTestId } = await render(
      <Placeholder placeholder={42} testID="ph" />
    );
    expect(getByTestId('ph').props.source).toBe(42);
  });
});
