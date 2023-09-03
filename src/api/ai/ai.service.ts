import { forwardRef, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey: apiKey });
  }
  private openai;

  async callAI(data: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'assistant', content: `you are now a Travel planner, write in formal.\n
                Caution: place name will be detail. ( exmaple: Osaka Castle, Dotonbori ), four place in each day, three nights plan.
                format is Day-(number), Don't forget "-". It's important.
                === User Info ===\n
                He is living in Korea.\n
                === Detail ===\n
                Recommend me a tour course.
                I'm going to ${data.region.join(', ')} in ${data.country}.
                I want to visit many places on a busy schedule early in the morning.
                Our hobby is ${data.hobby.join(', ')}.
                I really want to visit .
                My favorite foods are ${data.food.join(', ')}, so I want to eat them on this trip.\n
                === Etc ===\n
                For Three nights.\n
                Format your response:\n
                === Message ===
                ...
                === Itinerary ===
                Day-(number):
                -(place name): (detailed schedule),
                -Osaka Castle: Visit Osaka Castle and explore... ( example )
                === Farewell ===
                ...` }],
      // Format it as 'DAY-(number)' and '-(place name):(detailed schedule)', example: - Osaka Castle: Visit Osaka Castle and explore..., caution: place name can't be verb` }],
      // max_tokens: 128
    });
    // console.log(response.choices[0].message.content);
    const text = response.choices[0].message.content.toString();
    console.log(text);
    const messagePattern = /=== Message ===(.*?)=== Itinerary ===(.*?)=== Farewell ===(.*)/s;
    const [_, messageText, itineraryText, farewellText] = text.match(messagePattern);

    const itineraryPattern = /Day-(\d+):(.*?)(?=(?:Day-\d+:|$))/gs;
    const activityPattern = /- (.*?): (.*)/g;
    const itinerary = [];

    let match;
    while ((match = itineraryPattern.exec(itineraryText)) !== null) {
      const day = match[1];
      const activitiesText = match[2];
      const dayActivities = {};

      let activityMatch;
      while ((activityMatch = activityPattern.exec(activitiesText)) !== null) {
        const activityName = activityMatch[1];
        const activityDescription = activityMatch[2];
        dayActivities[activityName] = activityDescription;
      }

      itinerary.push(dayActivities);
    }

    // 결과 객체 생성
    const parsedData = {
      message: messageText.trim(),
      itinerary,
      farewell: farewellText.trim(),
      raw: "",
    };

    // 결과 출력
    console.log(parsedData);
    parsedData.raw = response.choices[0].message.content
    return parsedData;
  }

}
