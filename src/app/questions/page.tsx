'use client';
// app/questions/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateQuestions } from "./components/generate-questions";
import { QuestionBank } from "./components/question-bank";
import Container from '@/components/Container';
import { AddQuestions } from "./components/add-questions";
import QuestionBankQM from "./components/question-bank-qm";

export default function QuestionsPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Questions Management</h1>
          <p className="text-muted-foreground">
            Generate and manage your questions
          </p>
        </div>

        <Tabs defaultValue="bank" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bank">Question Bank</TabsTrigger>
            <TabsTrigger value="generate">Generate Questions</TabsTrigger>
            <TabsTrigger value="test">Generate Test</TabsTrigger>
            <TabsTrigger value="add">Add Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Question Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionBankQM />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Generate Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <GenerateQuestions />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Generate Test</CardTitle>
              </CardHeader>
              <CardContent>
                {/* TestGenerator component will go here */}
                <div>Test Generator coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Questions to table</CardTitle>
              </CardHeader>
              <CardContent>
                {/* TestGenerator component will go here */}
                <AddQuestions/>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}