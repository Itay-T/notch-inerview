import {createApp} from './app';
import { config } from './config';

const port = config.PORT;
const app = createApp();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
